package com.trendzy.api.controller;

import com.trendzy.api.model.FeaturedPick;
import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.FeaturedPickRepository;
import com.trendzy.api.repository.TrendRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FeaturedControllerTest {
    private final FeaturedPickRepository picks = mock(FeaturedPickRepository.class);
    private final TrendRepository trends = mock(TrendRepository.class);
    private final FeaturedController controller = new FeaturedController(picks, trends);

    @BeforeEach void fixClock() {
        // 18:45 UTC on 15 Nov is already 16 Nov in India.
        controller.setClock(Clock.fixed(Instant.parse("2026-11-15T18:45:00Z"), FeaturedController.INDIA));
    }

    private static Trend product(String id, boolean active, String shopUrl) {
        Trend trend = Trend.builder().id(id).active(active).build();
        Trend.ProductDetail detail = new Trend.ProductDetail();
        detail.setShopUrl(shopUrl);
        detail.setImageUrl("https://cdn.example/p.jpg");
        trend.getSignalProducts().setUnderdog(detail);
        return trend;
    }

    @Test void todayUsesTheIndiaCalendarDay() {
        when(picks.findById("2026-11-16")).thenReturn(Mono.just(FeaturedPick.builder().date("2026-11-16").trendId("t1").build()));
        when(trends.findById("t1")).thenReturn(Mono.just(product("t1", true, "https://brand.example/p")));
        var response = controller.today().block();
        assertEquals(200, response.getStatusCode().value());
        assertEquals("2026-11-16", response.getBody().get("date"));
    }

    @Test void inactiveOrMissingPickFallsBackToNoContent() {
        when(picks.findById("2026-11-16")).thenReturn(Mono.just(FeaturedPick.builder().date("2026-11-16").trendId("t1").build()));
        when(trends.findById("t1")).thenReturn(Mono.just(product("t1", false, "https://brand.example/p")));
        assertEquals(204, controller.today().block().getStatusCode().value());
    }

    @Test void pastOrFarFutureDatesAreRejectedBeforeAnyWrite() {
        for (String date : new String[] {"2026-11-15", "2027-03-01", "16-11-2026"}) {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> controller.feature(date, Map.of("trendId", "t1")).block());
            assertEquals(400, ex.getStatusCode().value());
        }
        verifyNoInteractions(picks, trends);
    }

    @Test void productWithoutStoreLinkCannotBeFeatured() {
        when(trends.findById("t1")).thenReturn(Mono.just(product("t1", true, "")));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.feature("2026-11-17", Map.of("trendId", "t1")).block());
        assertEquals(409, ex.getStatusCode().value());
        verify(picks, never()).save(any());
    }

    @Test void validPickIsSavedForThatDate() {
        when(trends.findById("t1")).thenReturn(Mono.just(product("t1", true, "https://brand.example/p")));
        when(picks.save(any())).thenAnswer(call -> Mono.just(call.getArgument(0)));
        FeaturedPick saved = controller.feature("2026-11-16", Map.of("trendId", "t1", "note", " Brand outreach ")).block();
        assertEquals("2026-11-16", saved.getDate());
        assertEquals("t1", saved.getTrendId());
        assertEquals("Brand outreach", saved.getNote());
    }
}
