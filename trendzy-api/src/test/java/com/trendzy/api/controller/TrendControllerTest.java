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

    @Test void invalidPaginationReturnsBadRequest() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getTrends("TEES", null, -1, 12).block());
        assertEquals(400, ex.getStatusCode().value());
        verifyNoInteractions(repository);
    }

    @Test void subcategoryIsLiteralAndCategoryIsNormalized() {
        when(repository.findByCategoryAndSubcategory(anyList(), anyString(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends(" tees ", "Graphic.*", 0, 12).block();
        verify(repository).findByCategoryAndSubcategory(eq(List.of("TEES")), eq("^\\QGraphic.*\\E$"), any(Pageable.class));
    }

    @Test void combinedCategoryIncludesBothLegacyCategoriesAndCapsFilter() {
        when(repository.findByCategoryAndSubcategory(anyList(), anyString(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends("Caps & Accessories", "Caps", 0, 12).block();
        verify(repository).findByCategoryAndSubcategory(eq(List.of("CAPS", "ACCESSORIES")), eq("^\\QCaps\\E$"), any(Pageable.class));
    }

    @Test void shoesAliasReadsExistingSneakerProducts() {
        when(repository.findByCategory(anyList(), any(Pageable.class))).thenReturn(Flux.empty());
        controller.getTrends(" shoes ", null, 0, 12).block();
        verify(repository).findByCategory(eq(List.of("SNEAKERS")), any(Pageable.class));
    }

    @Test void priceTypeCannotCreateAnIncompleteUnderdog() {
        when(repository.findById("missing-product")).thenReturn(Mono.just(Trend.builder().id("missing-product").build()));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.updateTrendPriceType("missing-product", Map.of("priceType", "SALE")).block());
        assertEquals(409, ex.getStatusCode().value());
        verifyNoInteractions(mongoTemplate);
    }

    @Test void priceTypeReturnsNotFoundForMissingTrend() {
        when(repository.findById("missing")).thenReturn(Mono.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.updateTrendPriceType("missing", Map.of("priceType", "SALE")).block());
        assertEquals(404, ex.getStatusCode().value());
        verifyNoInteractions(mongoTemplate);
    }
}
