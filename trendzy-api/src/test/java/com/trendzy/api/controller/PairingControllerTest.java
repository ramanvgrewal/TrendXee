package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.service.PairingService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import java.util.List;
import static org.mockito.Mockito.*;

class PairingControllerTest {
    private final PairingService service = mock(PairingService.class);
    private final WebTestClient client = WebTestClient.bindToController(new PairingController(service)).build();

    @Test void publicPairingsDefaultToAllAndCannotBeHttpCached() {
        when(service.pairings("id", "ALL", null)).thenReturn(Mono.just(
                new PairingService.Pairings("https://store/products/a", "UNISEX", false, List.of())));
        client.get().uri("/api/v2/trends/id/pairings").exchange().expectStatus().isOk()
                .expectHeader().valueEquals("Cache-Control", "no-store")
                .expectBody().jsonPath("$.sourceIdentity").isEqualTo("https://store/products/a")
                .jsonPath("$.slots").isArray().jsonPath("$.needsAudience").isEqualTo(false);
    }

    @Test void individualDetailIsDirectTrendAndPassesCurrentIdentity() {
        when(service.selectedProduct("id", "https://store/products/a")).thenReturn(Mono.just(Trend.builder().id("id").build()));
        client.get().uri(builder -> builder.path("/api/v2/trends/id")
                        .queryParam("sourceIdentity", "https://store/products/a").build()).exchange()
                .expectStatus().isOk().expectHeader().valueEquals("Cache-Control", "no-store")
                .expectBody().jsonPath("$.id").isEqualTo("id");
    }

    @Test void changedAndUnavailableSelectionsReturnDistinctHttpStatuses() {
        when(service.selectedProduct("changed", null)).thenReturn(Mono.error(new ResponseStatusException(HttpStatus.CONFLICT)));
        when(service.selectedProduct("gone", null)).thenReturn(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)));
        client.get().uri("/api/v2/trends/changed").exchange().expectStatus().isEqualTo(409).expectHeader().valueEquals("Cache-Control", "no-store");
        client.get().uri("/api/v2/trends/gone").exchange().expectStatus().isNotFound().expectHeader().valueEquals("Cache-Control", "no-store");
    }
}
