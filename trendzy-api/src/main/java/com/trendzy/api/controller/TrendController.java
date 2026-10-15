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
    private final org.springframework.data.mongodb.core.ReactiveMongoTemplate mongoTemplate;

    private Mono<Trend> patch(String id, org.springframework.data.mongodb.core.query.Update update) {
        return mongoTemplate.findAndModify(
                org.springframework.data.mongodb.core.query.Query.query(org.springframework.data.mongodb.core.query.Criteria.where("id").is(id)),
                update, org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true), Trend.class)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND)));
    }

    @Operation(summary = "Get trends by category", description = "Paginated list of trend items filtered by category")
    @GetMapping
    public Mono<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        log.info("[CTRL] Fetching trends for category: {}, subcategory: {}, page: {}, size: {}",
                category, subcategory, page, size);

        String requested = category.trim().toUpperCase(java.util.Locale.ROOT);
        String normalized = List.of("SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS", "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS").contains(requested) ? "SNEAKERS" : requested;
        if (page < 0 || size < 1 || size > 100) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "page must be non-negative and size must be 1..100"));
        }
        Pageable pageable = PageRequest.of(page, size);
        List<String> categories = List.of("CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES").contains(normalized)
                ? List.of("CAPS", "ACCESSORIES")
                : List.of(normalized);

        Flux<Trend> trendsFlux = (subcategory != null && !subcategory.trim().isEmpty())
                ? trendRepository.findByCategoryAndSubcategory(categories, "^" + java.util.regex.Pattern.quote(subcategory.trim()) + "$", pageable)
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
        Double price = body.get("price");
        if (price == null || !Double.isFinite(price) || price <= 0) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "A positive finite price is required"));
        }
        return trendRepository.findById(id)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND)))
                .flatMap(trend -> {
                    if (trend.getSignalProducts() == null || trend.getSignalProducts().getUnderdog() == null) {
                        return Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Trend has no underdog product"));
                    }
                    return patch(id, new org.springframework.data.mongodb.core.query.Update()
                            .set("signalProducts.underdog.price", price).set("estimatedPrice", price));
                });
    }

    @Operation(summary = "Update trend score (Admin only)", description = "Updates trend score. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/score")
    public Mono<Trend> updateTrendScore(@PathVariable String id, @RequestBody Map<String, Number> body) {
        log.info("[CTRL] Updating score for trend ID: {}", id);
        Number score = body.get("score");
        if (score == null || !Double.isFinite(score.doubleValue()) || score.doubleValue() < 0 || score.doubleValue() > 100) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "score must be 0..100"));
        }
        return patch(id, new org.springframework.data.mongodb.core.query.Update().set("trendScore", score.doubleValue()));
    }

    @Operation(summary = "Update trend price type (Admin only)", description = "Updates trend price type. Requires ROLE_ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/priceType")
    public Mono<Trend> updateTrendPriceType(@PathVariable String id, @RequestBody Map<String, String> body) {
        log.info("[CTRL] Updating price type for trend ID: {}", id);
        String priceType = body.get("priceType");
        if (priceType == null || priceType.isBlank()) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "priceType is required"));
        }
        return trendRepository.findById(id)
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND)))
                .flatMap(trend -> {
                    if (trend.getSignalProducts() == null || trend.getSignalProducts().getUnderdog() == null) {
                        return Mono.error(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Trend has no underdog product"));
                    }
                    return patch(id, new org.springframework.data.mongodb.core.query.Update()
                            .set("signalProducts.underdog.priceType", priceType.trim()));
                });
    }
}
