package com.trendzy.api.controller;

import com.trendzy.api.model.BrandReview;
import com.trendzy.api.repository.BrandReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
@Slf4j
public class BrandController {

    private final BrandReviewRepository brandReviewRepository;

    private Mono<String> getAuthenticatedUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    if (context.getAuthentication() == null || !context.getAuthentication().isAuthenticated() || "anonymousUser".equals(context.getAuthentication().getPrincipal())) {
                        return Mono.empty();
                    }
                    return Mono.just((String) context.getAuthentication().getPrincipal());
                });
    }

    @GetMapping("/{brandName}/comments")
    public Flux<BrandReview> getBrandComments(@PathVariable String brandName) {
        log.info("[CTRL] Fetching comments for brand: {}", brandName);
        return brandReviewRepository.findByBrandNameOrderByCreatedAtDesc(brandName);
    }

    @PostMapping("/{brandName}/comments")
    public Mono<BrandReview> addBrandComment(@PathVariable String brandName, @RequestBody BrandReview review) {
        log.info("[CTRL] Adding comment for brand: {}", brandName);
        review.setBrandName(brandName);
        review.setCreatedAt(LocalDateTime.now());

        return getAuthenticatedUserId()
                .defaultIfEmpty(review.getUserId() != null && !review.getUserId().isBlank() ? review.getUserId() : "anonymous")
                .flatMap(userId -> {
                    review.setUserId(userId);
                    return brandReviewRepository.save(review);
                });
    }
}
