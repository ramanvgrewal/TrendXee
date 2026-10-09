package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.model.BrandStats;
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
    private final BrandStatsRepository brandStatsRepository;

    @PostMapping("/{trendId}/rate")
    public Mono<Trend> rateProduct(@PathVariable String trendId, @RequestBody Map<String, Integer> body) {
        log.info("[CTRL] Rating product/brand for trend: {}", trendId);
        Integer rating = body.get("rating");
        if (rating == null || rating < 1 || rating > 5) {
            return Mono.error(new IllegalArgumentException("Rating must be between 1 and 5"));
        }

        return trendRepository.findById(trendId)
                .flatMap(trend -> {
                    String brandName = null;
                    if (trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                        brandName = trend.getSignalProducts().getUnderdog().getBrandName();
                    }

                    if (brandName == null || brandName.isEmpty()) {
                        // Fallback to trend-only update if no brand
                        return updateTrendRating(trend, rating, trend.getUserRatingAverage(), trend.getUserRatingCount());
                    }

                    final String finalBrandName = brandName;
                    
                    return brandStatsRepository.findById(finalBrandName)
                            .defaultIfEmpty(BrandStats.builder().brandName(finalBrandName).userRatingAverage(0.0).userRatingCount(0).build())
                            .flatMap(stats -> {
                                int currentCount = stats.getUserRatingCount() != null ? stats.getUserRatingCount() : 0;
                                double currentAverage = stats.getUserRatingAverage() != null ? stats.getUserRatingAverage() : 0.0;
                                
                                double newAverage = ((currentAverage * currentCount) + rating) / (currentCount + 1);
                                stats.setUserRatingCount(currentCount + 1);
                                stats.setUserRatingAverage(newAverage);

                                return brandStatsRepository.save(stats);
                            })
                            .flatMap(savedStats -> {
                                // Sync all trends with this brand
                                return trendRepository.findByBrandName(finalBrandName)
                                        .flatMap(t -> updateTrendRating(t, null, savedStats.getUserRatingAverage(), savedStats.getUserRatingCount()))
                                        .then(trendRepository.findById(trendId)); // Return the original requested trend updated
                            });
                });
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

        return trendRepository.save(trend);
    }
}
