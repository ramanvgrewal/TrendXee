package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/trends")
@RequiredArgsConstructor
@Slf4j
public class TrendController {

    private final TrendRepository trendRepository;

    @GetMapping
    public Mono<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        log.info("[CTRL] Fetching trends for category: {}, page: {}, size: {}",
                category, page, size);

        String normalized = category.trim().toUpperCase();
        Pageable pageable = PageRequest.of(page, size);
        List<String> categories = normalized.equals("CAPS")
                ? List.of("CAPS", "ACCESSORIES")
                : List.of(normalized);

        return trendRepository.findByCategory(categories, pageable)
                .collectList()
                .map(trends -> Map.of(
                        "content", trends,
                        "category", normalized,
                        "page", page,
                        "size", size
                ));
    }

    @DeleteMapping("/{id}")
    public Mono<Map<String, Object>> deleteTrendById(@PathVariable String id) {
        log.info("[CTRL] Permanently deleting trend with ID: {}", id);
        return trendRepository.deleteById(id)
                .then(Mono.just(Map.of(
                        "deletedId", id,
                        "message", "Successfully deleted trend permanently"
                )));
    }

    @PatchMapping("/{id}/price")
    public Mono<Trend> updateTrendPrice(@PathVariable String id, @RequestBody Map<String, Double> body) {
        log.info("[CTRL] Updating price for trend ID: {}", id);
        return trendRepository.findById(id)
                .flatMap(trend -> {
                    Double newPrice = body.get("price");
                    if (newPrice != null && trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                        trend.getSignalProducts().getUnderdog().setPrice(newPrice);
                        trend.setEstimatedPrice(newPrice);
                    }
                    return trendRepository.save(trend);
                });
    }

    @PatchMapping("/{id}/score")
    public Mono<Trend> updateTrendScore(@PathVariable String id, @RequestBody Map<String, Number> body) {
        log.info("[CTRL] Updating score for trend ID: {}", id);
        return trendRepository.findById(id)
                .flatMap(trend -> {
                    Number newScore = body.get("score");
                    if (newScore != null) {
                        trend.setTrendScore(newScore.doubleValue());
                    }
                    return trendRepository.save(trend);
                });
    }

    @PatchMapping("/{id}/priceType")
    public Mono<Trend> updateTrendPriceType(@PathVariable String id, @RequestBody Map<String, String> body) {
        log.info("[CTRL] Updating price type for trend ID: {}", id);
        return trendRepository.findById(id)
                .flatMap(trend -> {
                    String newPriceType = body.get("priceType");
                    if (newPriceType != null && trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                        trend.getSignalProducts().getUnderdog().setPriceType(newPriceType);
                    }
                    return trendRepository.save(trend);
                });
    }
}
