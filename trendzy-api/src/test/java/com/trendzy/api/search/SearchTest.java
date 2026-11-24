package com.trendzy.api.search;

import com.trendzy.api.controller.TrendController;
import com.trendzy.api.model.ApprovedTaxonomy;
import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SearchTest {
    private static Trend trend(String id, String brand, String title, String category, String style, String audience, double score, String... tags) {
        var product = Trend.ProductDetail.builder().brandName(brand).title(title).audience(audience).tags(List.of(tags)).build();
        return Trend.builder().id(id).category(category).subcategory(style).trendScore(score)
                .signalProducts(Trend.SignalProducts.builder().underdog(product).build()).build();
    }

    private final SearchIndex index = new SearchIndex(List.of(
            trend("tee", "Powerlook", "Black Oversized T-Shirt", "TEES", "Graphic Tees", "MEN", 90),
            trend("tee2", "Ombreia", "Boxy Tshirt", "TEES", "Basic Tees", "WOMEN", 80),
            trend("hood", "Bonkers Corner", "Fleece Hoodie", "OUTERWEAR", "Hoodies & Winter Jackets", "UNISEX", 70),
            trend("jean", "Rigo", "Baggy Denim", "JEANS", "Baggy Jeans", "MEN", 60),
            trend("styled", "Rigo", "Blue Denim", "JEANS", "Baggy Jeans", "MEN", 99),
            trend("tagged", "Gritstones", "Blue Shirt", "SHIRTS", "Linen Shirts", "MEN", 100, "baggy"),
            trend("named", "Other", "Rigo Style Cap", "CAPS", "Caps & Snapbacks", "UNISEX", 100),
            trend("shoe", "7-10", "Karigar White", "SNEAKERS", null, "UNISEX", 50)));

    private List<String> ids(String query) { return ids(query, "ALL"); }

    private List<String> ids(String query, String audience) {
        return index.search(query, audience, 0, 50).content().stream().map(Trend::getId).toList();
    }

    @Test void tshirtSpellingsAreTheSame() {
        for (String query : List.of("tshirt", "t-shirt", "T Shirts", "tee", "tees", "tshi", "t-sh")) {
            assertEquals(List.of("tee", "tee2"), ids(query), query);
        }
        assertEquals(List.of("hood"), ids("hoodies"));
        assertEquals(List.of("hood"), ids("hoody"));
        assertEquals(List.of("shoe"), ids("shoes"));
    }

    @Test void ranksTitleThenStyleThenTagsAheadOfScore() {
        assertEquals(List.of("jean", "styled", "tagged"), ids("baggy"));
        assertEquals(List.of("jean", "styled", "tagged"), ids("bag"));
    }

    @Test void exactBrandComesFirst() {
        assertEquals(List.of("styled", "jean", "named"), ids("rigo"));
        assertEquals(new SearchResult.Brand("Rigo", 2), index.search("rigo", "ALL", 0, 5).brands().get(0));
        assertEquals(List.of("hood"), ids("bonkerscorner"));
        assertEquals(List.of("shoe"), ids("7-10"));
    }

    @Test void everyWordMustMatch() {
        assertEquals(List.of("tee"), ids("black oversized tee for men"));
        assertEquals(List.of(), ids("black hoodie"));
    }

    @Test void typosAreCorrectedOnlyWithoutAStrictMatch() {
        assertEquals(List.of("hood"), ids("hodoie"));
        assertEquals(List.of("tee"), ids("oversizde"));
        assertEquals(List.of("hood"), ids("bonker corner"));
        assertEquals(List.of(), ids("zzzzzzzz"));
    }

    @Test void audienceFilterIncludesUnisex() {
        assertEquals(List.of("tee"), ids("tee", "MEN"));
        assertEquals(List.of("tee2"), ids("tee", "WOMEN"));
        assertEquals(List.of(), ids("tee", "UNISEX"));
        assertEquals(List.of("hood"), ids("hoodie", "WOMEN"));
    }

    @Test void oldLabelsSuggestTheCurrentStyleAndSneakersTheLane() {
        assertEquals(List.of(new SearchResult.Style("OUTERWEAR", "Hoodies & Sweatshirts", 1)),
                index.search("hoodie", "ALL", 0, 5).styles());
        assertEquals(List.of(new SearchResult.Style("SNEAKERS", null, 1)),
                index.search("sneakers", "ALL", 0, 5).styles());
    }

    @Test void symbolsAreNotPatterns() {
        for (String query : List.of(".*", "$$", "^(", "[a", "\\Q")) assertDoesNotThrow(() -> index.search(query, "ALL", 0, 5), query);
        assertEquals(List.of(), ids(".*"));
        assertEquals(List.of(), index.search(".*", "ALL", 0, 5).brands());
    }

    @Test void pagesNeverRepeatAndHugePagesAreEmpty() {
        var many = new ArrayList<Trend>();
        for (int i = 0; i < 55; i++) many.add(trend("id" + i, "Brand", "Same Cap", "CAPS", "Caps & Headwear", "MEN", 10));
        var big = new SearchIndex(many);
        var seen = new HashSet<String>();
        for (int page = 0; page < 6; page++) {
            var result = big.search("cap", "ALL", page, 10);
            assertEquals(page < 5, result.hasMore());
            result.content().forEach(trend -> assertTrue(seen.add(trend.getId())));
        }
        assertEquals(55, seen.size());
        assertTrue(big.search("cap", "ALL", Integer.MAX_VALUE, 50).content().isEmpty());
    }

    @Test void loadsEveryLaneWithVisibilityRulesAndSurvivesFailure() {
        var mongo = mock(ReactiveMongoTemplate.class);
        when(mongo.find(any(Query.class), eq(Trend.class))).thenReturn(Flux.empty());
        var service = new SearchService(mongo);
        assertEquals(503, assertThrows(ResponseStatusException.class, () -> service.search("tee", "ALL", 0, 5)).getStatusCode().value());

        when(mongo.find(argThat(q -> q != null && "TEES".equals(q.getQueryObject().get("category"))), eq(Trend.class)))
                .thenReturn(Flux.just(trend("tee", "Brand", "Tee", "TEES", "Basic Tees", "MEN", 1)));
        service.refresh().block();
        var queries = ArgumentCaptor.forClass(Query.class);
        verify(mongo, times(ApprovedTaxonomy.categories().size())).find(queries.capture(), eq(Trend.class));
        for (Query query : queries.getAllValues()) {
            var criteria = query.getQueryObject();
            assertTrue(criteria.keySet().containsAll(List.of("active", "taxonomyReview", "taxonomyDuplicateOf", "$or", "subcategory")));
            if ("SNEAKERS".equals(criteria.get("category"))) assertEquals(true, criteria.get("indianUnderdogBrand"));
        }
        when(mongo.find(any(Query.class), eq(Trend.class))).thenReturn(Flux.error(new IllegalStateException("down")));
        service.refresh().block();
        assertEquals(1, service.search("tee", "ALL", 0, 5).totalElements());
    }

    @Test void adminDeleteRefreshesSearch() {
        var repository = mock(TrendRepository.class);
        var service = mock(SearchService.class);
        when(repository.deleteById("x")).thenReturn(Mono.empty());
        var controller = new TrendController(repository, mock(ReactiveMongoTemplate.class));
        org.springframework.test.util.ReflectionTestUtils.setField(controller, "searchService", service);
        controller.deleteTrendById("x").block();
        verify(service).requestRefresh();
    }

    @Test void httpContract() {
        var service = mock(SearchService.class);
        when(service.search("tee", "MEN", 0, 24)).thenReturn(index.search("tee", "MEN", 0, 24));
        var client = WebTestClient.bindToController(new SearchController(service)).build();
        client.get().uri("/api/v2/search?q= tee &audience=men").exchange().expectStatus().isOk().expectBody()
                .jsonPath("$.content[0].id").isEqualTo("tee").jsonPath("$.totalElements").isEqualTo(1)
                .jsonPath("$.hasMore").isEqualTo(false).jsonPath("$.styles").isArray();
        for (String bad : List.of("", "?q=a", "?q=" + "a".repeat(81), "?q=tee&size=51", "?q=tee&size=0", "?q=tee&page=-1", "?q=tee&audience=KIDS")) {
            client.get().uri("/api/v2/search" + bad).exchange().expectStatus().isBadRequest();
        }
    }
}
