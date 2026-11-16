package com.trendzy.api.controller;

import com.trendzy.api.config.SecurityConfigAccess;
import com.trendzy.api.model.BrandReview;
import com.trendzy.api.repository.BrandReviewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BrandAndRatingSafetyTest {
    private final BrandReviewRepository reviews = mock(BrandReviewRepository.class);
    private final BrandController brands = new BrandController(reviews);

    private static <T> Mono<T> asUser(Mono<T> mono, String userId) {
        var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return mono.contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
    }

    @Test void clientCannotChooseReviewIdOrAuthor() {
        when(reviews.save(any())).thenAnswer(call -> Mono.just(call.getArgument(0)));
        BrandReview saved = asUser(brands.addBrandComment("Label",
                Map.of("id", "someone-elses-review", "userId", "victim", "comment", "  Nice fit  ")), "u1").block();
        assertNull(saved.getId());
        assertEquals("u1", saved.getUserId());
        assertEquals("Nice fit", saved.getComment());
    }

    @Test void emptyOrOversizedCommentsAreRejected() {
        for (String text : new String[] {"   ", "x".repeat(BrandController.MAX_COMMENT_LENGTH + 1)}) {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> asUser(brands.addBrandComment("Label", Map.of("comment", text)), "u1").block());
            assertEquals(400, ex.getStatusCode().value());
        }
        verify(reviews, never()).save(any());
    }

    @Test void repeatRatingReplacesTheUsersEarlierVote() {
        double[] first = ProductController.applyRating(4.0, 2, null, 2);
        assertEquals(3, (int) first[1]);
        assertEquals(10.0 / 3, first[0], 1e-9);
        double[] changed = ProductController.applyRating(first[0], 3, 2, 5);
        assertEquals(3, (int) changed[1]);
        assertEquals(13.0 / 3, changed[0], 1e-9);
    }

    @Test void corsAllowsOnlyTrendXeeAndExactConfiguredOrigins() {
        List<String> origins = SecurityConfigAccess.origins(" https://trendxee-git-main-raman.vercel.app , https://*.vercel.app, http://evil.example ");
        assertTrue(origins.contains("https://www.trendxee.com"));
        assertTrue(origins.contains("https://trendxee-git-main-raman.vercel.app"));
        assertFalse(origins.stream().anyMatch(o -> o.contains("*.vercel.app")));
        assertFalse(origins.contains("http://evil.example"));
    }
}
