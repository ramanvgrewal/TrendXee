package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Tag(name = "Trends", description = "Trending clothing & styles catalog")
@RestController
@RequestMapping("/api/v2/trends")
@RequiredArgsConstructor
@Slf4j
public class TrendController {

    private final TrendRepository trendRepository;

    @Operation(summary = "Get trends by category", description = "Paginated list of trend items filtered by category")
    @GetMapping
    public Mono<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        log.info("[CTRL] Fetching trends for category: {}, subcategory: {}, page: {}, size: {}",
                category, subcategory, page, size);

        String normalized = category.trim().toUpperCase();
        Pageable pageable = PageRequest.of(page, size);
        List<String> categories = normalized.equals("CAPS")
                ? List.of("CAPS", "ACCESSORIES")
                : List.of(normalized);

        Flux<Trend> trendsFlux = (subcategory != null && !subcategory.trim().isEmpty())
                ? trendRepository.findByCategoryAndSubcategory(categories, subcategory.trim(), pageable)
                : trendRepository.findByCategory(categories, pageable);

        return trendsFlux
                .collectList()
                .map(trends -> {
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("content", trends);
                    result.put("category", normalized);
                    if (subcategory != null && !subcategory.trim().isEmpty()) {
                        result.put("subcategory", subcategory.trim());
                    }
                    result.put("page", page);
                    result.put("size", size);
                    return result;
                });
    }

    @Operation(summary = "Delete trend permanently (Admin only)", description = "Permanently deletes trend by ID. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public Mono<Map<String, Object>> deleteTrendById(@PathVariable String id) {
        log.info("[CTRL] Permanently deleting trend with ID: {}", id);
        return trendRepository.deleteById(id)
                .then(Mono.just(Map.of(
                        "deletedId", id,
                        "message", "Successfully deleted trend permanently"
                )));
    }

    @Operation(summary = "Update trend price (Admin only)", description = "Updates trend price. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
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

    @Operation(summary = "Update trend score (Admin only)", description = "Updates trend score. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
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

    @Operation(summary = "Update trend price type (Admin only)", description = "Updates trend price type. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
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
