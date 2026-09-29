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
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public Mono<Void> deleteTrendById(@PathVariable String id) {
        log.info("[CTRL] Permanently deleting trend with ID: {}", id);
        return trendRepository.findById(id)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Trend not found: " + id)))
                .flatMap(trend -> trendRepository.deleteById(trend.getId()));
    }

    @PatchMapping("/{id}/price")
    public Mono<Trend> updateTrendPrice(@PathVariable String id, @RequestBody Map<String, Double> body) {
        log.info("[CTRL] Updating price for trend ID: {}", id);
        Double newPrice = body.get("price");
        if (newPrice == null || newPrice <= 0) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "A valid positive price is required"));
        }
        return trendRepository.findById(id)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Trend not found")))
                .flatMap(trend -> {
                    // Always update estimatedPrice regardless of whether underdog product exists
                    trend.setEstimatedPrice(newPrice);
                    // Conditionally update the underdog product price if it exists
                    if (trend.getSignalProducts() != null && trend.getSignalProducts().getUnderdog() != null) {
                        trend.getSignalProducts().getUnderdog().setPrice(newPrice);
                    }
                    return trendRepository.save(trend);
                });
    }
}
