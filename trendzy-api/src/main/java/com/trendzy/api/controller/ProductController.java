package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.model.BrandRating;
import com.trendzy.api.model.BrandStats;
import com.trendzy.api.repository.BrandRatingRepository;
import com.trendzy.api.repository.TrendRepository;
import com.trendzy.api.repository.BrandStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final TrendRepository trendRepository;
    private final org.springframework.data.mongodb.core.ReactiveMongoTemplate mongoTemplate;
    private final BrandStatsRepository brandStatsRepository;
    private final BrandRatingRepository brandRatingRepository;

    /**
     * Applies one user's rating to a running average. A repeat rating from the
     * same user replaces their earlier one instead of adding another vote.
     */
    static double[] applyRating(double average, int count, Integer previous, int rating) {
        if (previous == null || count <= 0) {
            return new double[] {((average * count) + rating) / (count + 1), count + 1};
        }
        return new double[] {((average * count) - previous + rating) / count, count};
    }

    private Mono<String> currentUserId() {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.getContext()
                .map(context -> context.getAuthentication())
                .filter(auth -> auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                .map(auth -> (String) auth.getPrincipal())
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED)));
    }

    @PostMapping("/{trendId}/rate")
    public Mono<Trend> rateProduct(@PathVariable String trendId, @RequestBody Map<String, Integer> body) {
        log.info("[CTRL] Rating product/brand for trend: {}", trendId);
        Integer rating = body == null ? null : body.get("rating");
        if (rating == null || rating < 1 || rating > 5) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5"));
        }

        return currentUserId().flatMap(userId -> trendRepository.findById(trendId)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND)))
                .flatMap(trend -> {
                    String brandName = null;
                    if (trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                        brandName = trend.getSignalProducts().getUnderdog().getBrandName();
                    }
                    String ratingKey = brandName == null || brandName.isEmpty() ? "trend:" + trendId : brandName;
                    String ratingId = BrandRating.idFor(userId, ratingKey);

                    Mono<Integer> previousRating = brandRatingRepository.findById(ratingId)
                            .map(BrandRating::getRating)
                            .defaultIfEmpty(0);
                    Mono<BrandRating> saveVote = brandRatingRepository.save(BrandRating.builder()
                            .id(ratingId).userId(userId).ratingKey(ratingKey).rating(rating)
                            .updatedAt(java.time.Instant.now()).build());

                    if (brandName == null || brandName.isEmpty()) {
                        // No brand: keep the rating on this product only.
                        return previousRating.flatMap(prev -> {
                            double[] next = applyRating(
                                    trend.getUserRatingAverage() != null ? trend.getUserRatingAverage() : 0.0,
                                    trend.getUserRatingCount() != null ? trend.getUserRatingCount() : 0,
                                    prev == 0 ? null : prev, rating);
                            return saveVote.then(updateTrendRating(trend, null, next[0], (int) next[1]));
                        });
                    }

                    final String finalBrandName = brandName;

                    return previousRating.flatMap(prev -> brandStatsRepository.findById(finalBrandName)
                            .defaultIfEmpty(BrandStats.builder().brandName(finalBrandName).userRatingAverage(0.0).userRatingCount(0).build())
                            .flatMap(stats -> {
                                int currentCount = stats.getUserRatingCount() != null ? stats.getUserRatingCount() : 0;
                                double currentAverage = stats.getUserRatingAverage() != null ? stats.getUserRatingAverage() : 0.0;
                                double[] next = applyRating(currentAverage, currentCount, prev == 0 ? null : prev, rating);
                                stats.setUserRatingAverage(next[0]);
                                stats.setUserRatingCount((int) next[1]);
                                return saveVote.then(brandStatsRepository.save(stats));
                            }))
                            .flatMap(savedStats -> {
                                // Sync all trends with this brand
                                return trendRepository.findByBrandName(finalBrandName)
                                        .flatMap(t -> updateTrendRating(t, null, savedStats.getUserRatingAverage(), savedStats.getUserRatingCount()))
                                        .then(trendRepository.findById(trendId)); // Return the original requested trend updated
                            });
                }));
    }

    private Mono<Trend> updateTrendRating(Trend trend, Integer singleRatingToAdd, Double avg, Integer count) {
        if (singleRatingToAdd != null) {
            int currentCount = trend.getUserRatingCount() != null ? trend.getUserRatingCount() : 0;
            double currentAverage = trend.getUserRatingAverage() != null ? trend.getUserRatingAverage() : 0.0;
            avg = ((currentAverage * currentCount) + singleRatingToAdd) / (currentCount + 1);
            count = currentCount + 1;
        }

        trend.setUserRatingCount(count);
        trend.setUserRatingAverage(avg);

        double scraperRating = 5.0;
        if (trend.getRatingSignals() != null && trend.getRatingSignals().containsKey("rating")) {
            Object r = trend.getRatingSignals().get("rating");
            if (r instanceof Number) {
                scraperRating = ((Number) r).doubleValue();
            } else if (r instanceof String) {
                try {
                    scraperRating = Double.parseDouble((String) r);
                } catch (NumberFormatException ignored) {}
            }
        }

        double blendedRating = (scraperRating + (avg * count)) / (1 + count);
        trend.setUnderdogRating(blendedRating);

        return mongoTemplate.findAndModify(
                org.springframework.data.mongodb.core.query.Query.query(org.springframework.data.mongodb.core.query.Criteria.where("id").is(trend.getId())),
                new org.springframework.data.mongodb.core.query.Update()
                        .set("userRatingCount", count).set("userRatingAverage", avg).set("underdogRating", blendedRating),
                org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true), Trend.class);
    }
}
