package com.trendzy.api.controller;

import com.trendzy.api.model.BrandReview;
import com.trendzy.api.repository.BrandReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
@Slf4j
public class BrandController {

    static final int MAX_COMMENT_LENGTH = 1000;

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

    /**
     * Only the comment text is taken from the request. The ID, author and date
     * are set here, so a client cannot overwrite another person's review.
     */
    @PostMapping("/{brandName}/comments")
    public Mono<BrandReview> addBrandComment(@PathVariable String brandName, @RequestBody Map<String, Object> body) {
        Object raw = body == null ? null : body.get("comment");
        String comment = raw instanceof String text ? text.strip() : "";
        if (comment.isEmpty() || comment.length() > MAX_COMMENT_LENGTH || comment.indexOf('\0') >= 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "comment must be 1-" + MAX_COMMENT_LENGTH + " characters"));
        }
        return getAuthenticatedUserId()
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED)))
                .flatMap(userId -> brandReviewRepository.save(BrandReview.builder()
                        .brandName(brandName)
                        .userId(userId)
                        .comment(comment)
                        .createdAt(LocalDateTime.now())
                        .build()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{brandName}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteBrandComment(@PathVariable String brandName, @PathVariable String commentId) {
        return brandReviewRepository.findById(commentId)
                .filter(review -> brandName.equals(review.getBrandName()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                .flatMap(review -> {
                    log.info("[ADMIN] Deleted review {} for brand {}", commentId, brandName);
                    return brandReviewRepository.delete(review);
                });
    }
}
