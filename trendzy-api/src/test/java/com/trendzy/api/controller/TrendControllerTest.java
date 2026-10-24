package com.trendzy.api.controller;

import com.trendzy.api.repository.TrendRepository;
import com.trendzy.api.model.Trend;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TrendControllerTest {
    private final TrendRepository repository = mock(TrendRepository.class);
    private final ReactiveMongoTemplate mongoTemplate = mock(ReactiveMongoTemplate.class);
    private final TrendController controller = new TrendController(repository, mongoTemplate);

    @Test void choicesStayStableForTheWholeLaneWhileResultsAndTotalUseCombinedFilters() {
        when(mongoTemplate.find(any(org.springframework.data.mongodb.core.query.Query.class), eq(Trend.class)))
                .thenReturn(Flux.just(Trend.builder().id("baggy").build()));
        when(mongoTemplate.count(any(org.springframework.data.mongodb.core.query.Query.class), eq(Trend.class))).thenReturn(Mono.just(13L));
        when(mongoTemplate.findDistinct(any(org.springframework.data.mongodb.core.query.Query.class), eq("subcategory"), eq(Trend.class), eq(String.class)))
                .thenReturn(Flux.just("Wide Leg Jeans", "Baggy Jeans", "Baggy Jeans", ""));
        var result = controller.getFilteredTrends("JEANS", "Baggy Jeans", 1, 12, "WOMEN", 1000.0, 2000.0, true).block();
        assertEquals(13L, result.get("totalElements"));
        assertEquals(false, result.get("hasMore"));
        assertEquals(List.of("Baggy Jeans", "Wide Leg Jeans"), result.get("subcategories"));
        assertEquals(List.of(new com.trendzy.api.service.CatalogStyles.Option("baggy", "Baggy & wide-leg")), result.get("styles"));
        verify(mongoTemplate).findDistinct(argThat(query -> !query.getQueryObject().containsKey("subcategory")
                && !query.getQueryObject().containsKey("signalProducts.underdog.price")
                && !query.getQueryObject().containsKey("$expr")), eq("subcategory"), eq(Trend.class), eq(String.class));
        verify(mongoTemplate).count(argThat(query -> query.getSkip() == 0 && query.getLimit() == 0
                && query.getQueryObject().containsKey("subcategory")
                && query.getQueryObject().containsKey("signalProducts.underdog.price")), eq(Trend.class));
        verifyNoInteractions(repository);
    }

    @Test void invalidPriceIsBadRequestOverHttp() {
        org.springframework.test.web.reactive.server.WebTestClient.bindToController(controller).build()
                .get().uri("/api/v2/trends?category=JEANS&minPrice=2000&maxPrice=1000").exchange().expectStatus().isBadRequest();
        verifyNoInteractions(mongoTemplate, repository);
    }

    @Test void invalidPaginationReturnsBadRequest() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getTrends("TEES", null, -1, 12, "ALL").block());
        assertEquals(400, ex.getStatusCode().value());
        verifyNoInteractions(repository);
    }

    @Test void subcategoryIsLiteralAndCategoryIsNormalized() {
        when(repository.findByCategoryAndSubcategory(anyList(), anyString(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends(" tees ", "Graphic.*", 0, 12, "ALL").block();
        verify(repository).findByCategoryAndSubcategory(eq(List.of("TEES")), eq("^\\QGraphic.*\\E$"), any(Pageable.class));
    }

    @Test void combinedCategoryIncludesBothLegacyCategoriesAndCapsFilter() {
        when(repository.findByCategoryAndSubcategory(anyList(), anyString(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends("Caps & Accessories", "Caps", 0, 12, "ALL").block();
        verify(repository).findByCategoryAndSubcategory(eq(List.of("CAPS", "ACCESSORIES")), eq("^\\QCaps\\E$"), any(Pageable.class));
    }

    @Test void shoesAliasReadsExistingSneakerProducts() {
        when(repository.findByCategory(anyList(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends(" shoes ", null, 0, 12, "ALL").block();
        verify(repository).findByCategory(eq(List.of("SNEAKERS")), any(Pageable.class));
    }

    @Test void priceTypeCannotCreateAnIncompleteUnderdog() {
        when(repository.findById("missing-product")).thenReturn(Mono.just(Trend.builder().id("missing-product").build()));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.updateTrendPriceType("missing-product", Map.of("priceType", "SALE")).block());
        assertEquals(409, ex.getStatusCode().value());
        verifyNoInteractions(mongoTemplate);
    }

    @Test void menAndWomenIncludeUnisexInDatabaseQueryBeforePagination() {
        when(repository.findByCategoryAndAudience(anyList(), anyList(), any(Pageable.class))).thenReturn(Flux.empty());
        for (String audience : List.of("MEN", "WOMEN")) {
            Map<String, Object> response = controller.getTrends("JEANS", null, 2, 12, " " + audience.toLowerCase() + " ").block();
            assertEquals(audience, response.get("audience"));
            verify(repository).findByCategoryAndAudience(eq(List.of("JEANS")), eq(List.of(audience, "UNISEX")),
                    argThat(pageable -> pageable.getOffset() == 24 && pageable.getPageSize() == 12));
        }
        verify(repository, never()).findByCategory(anyList(), any());
    }

    @Test void unisexAndSubcategoryFilterComposeUsingNormalizedAudience() {
        when(repository.findByCategoryAndSubcategoryAndAudience(anyList(), anyString(), anyList(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends("BOTTOMS", "Cargo.*", 0, 12, "UNISEX").block();
        verify(repository).findByCategoryAndSubcategoryAndAudience(eq(List.of("BOTTOMS")), eq("^\\QCargo.*\\E$"),
                eq(List.of("UNISEX")), any(Pageable.class));
    }

    @Test void legacyUnknownAndMissingProductsAreReturnedAsUnisex() {
        Trend unknown = Trend.builder().id("unknown").signalProducts(Trend.SignalProducts.builder()
                .underdog(Trend.ProductDetail.builder().audience("UNKNOWN").build()).build()).build();
        Trend missing = Trend.builder().id("missing").signalProducts(Trend.SignalProducts.builder()
                .underdog(Trend.ProductDetail.builder().build()).build()).build();
        when(repository.findByCategoryAndAudience(anyList(), anyList(), any(Pageable.class)))
                .thenReturn(Flux.just(unknown, missing));
        var client = org.springframework.test.web.reactive.server.WebTestClient.bindToController(controller).build();
        for (String audience : List.of("MEN", "WOMEN")) {
            client.get().uri("/api/v2/trends?category=JEANS&audience=" + audience).exchange()
                    .expectStatus().isOk().expectBody()
                    .jsonPath("$.content[0].signalProducts.underdog.audience").isEqualTo("UNISEX")
                    .jsonPath("$.content[1].signalProducts.underdog.audience").isEqualTo("UNISEX")
                    .jsonPath("$.content[1].signalProducts.underdog.audienceSource").isEqualTo("default:unknown-as-unisex");
        }
    }

    @Test void unknownFilterIsRejectedInsteadOfSilentlyShowingAll() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getTrends("TEES", null, 0, 12, "WOMAN").block());
        assertEquals(400, ex.getStatusCode().value());
        verifyNoInteractions(repository);
    }

    @Test void existingClientsDefaultToAllWithoutAnAudienceParameter() {
        when(repository.findByCategory(anyList(), any(Pageable.class))).thenReturn(Flux.empty());
        org.springframework.test.web.reactive.server.WebTestClient.bindToController(controller).build()
                .get().uri("/api/v2/trends?category=JEANS").exchange()
                .expectStatus().isOk().expectBody().jsonPath("$.audience").isEqualTo("ALL");
        verify(repository).findByCategory(eq(List.of("JEANS")), any(Pageable.class));
    }

    @Test void priceTypeReturnsNotFoundForMissingTrend() {
        when(repository.findById("missing")).thenReturn(Mono.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.updateTrendPriceType("missing", Map.of("priceType", "SALE")).block());
        assertEquals(404, ex.getStatusCode().value());
        verifyNoInteractions(mongoTemplate);
    }
}
