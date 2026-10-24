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

    @Operation(summary = "Get trends by category", description = "Category, audience and grouped styles, applied before pagination. Legacy exact subcategory and price parameters remain supported.")
    @GetMapping
    public Mono<Map<String, Object>> getFilteredTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "ALL") String audience,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "false") boolean includeFilters,
            @RequestParam(required = false) String style) {
        if (minPrice == null && maxPrice == null && !includeFilters && (style == null || style.isBlank())) {
            return getTrends(category, subcategory, page, size, audience);
        }
        if (page < 0 || size < 1 || size > 100) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "page must be non-negative and size must be 1..100");
        }
        var criteria = com.trendzy.api.service.CatalogFilterQuery.build(category, audience, subcategory, minPrice, maxPrice, style);
        var choices = includeFilters
                ? mongoTemplate.findDistinct(com.trendzy.api.service.CatalogFilterQuery.build(category, "ALL", null, null, null),
                        "subcategory", Trend.class, String.class)
                    .filter(value -> value != null && !value.isBlank()).map(String::trim).distinct()
                    .sort(String.CASE_INSENSITIVE_ORDER).collectList()
                : Mono.just(List.<String>of());
        return Mono.zip(
                mongoTemplate.find(com.trendzy.api.service.CatalogFilterQuery.page(criteria, page, size), Trend.class).collectList(),
                mongoTemplate.count(criteria, Trend.class), choices)
            .map(data -> {
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("content", data.getT1());
                result.put("totalElements", data.getT2());
                result.put("hasMore", ((long) page + 1) * size < data.getT2());
                result.put("page", page);
                result.put("size", size);
                result.put("audience", audience == null ? "ALL" : audience.trim().toUpperCase(java.util.Locale.ROOT));
                if (includeFilters) {
                    result.put("subcategories", data.getT3());
                    result.put("styles", com.trendzy.api.service.CatalogStyles.options(category, data.getT3()));
                }
                return result;
            });
    }

    public Mono<Map<String, Object>> getFilteredTrends(String category, String subcategory, int page, int size, String audience,
                                                       Double minPrice, Double maxPrice, boolean includeFilters) {
        return getFilteredTrends(category, subcategory, page, size, audience, minPrice, maxPrice, includeFilters, null);
    }

    // Kept for existing callers and repository-based feeds without facets or price bounds.
    public Mono<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(required = false) String subcategory,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "ALL") String audience) {

        log.info("[CTRL] Fetching trends for category: {}, subcategory: {}, page: {}, size: {}",
                category, subcategory, page, size);

        String requested = category.trim().toUpperCase(java.util.Locale.ROOT);
        String normalized = List.of("SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS", "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS").contains(requested) ? "SNEAKERS" : requested;
        String normalizedAudience = audience == null ? "ALL" : audience.trim().toUpperCase(java.util.Locale.ROOT);
        if (!List.of("ALL", "MEN", "WOMEN", "UNISEX").contains(normalizedAudience)) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "audience must be ALL, MEN, WOMEN or UNISEX"));
        }
        if (page < 0 || size < 1 || size > 100) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "page must be non-negative and size must be 1..100"));
        }
        Pageable pageable = PageRequest.of(page, size);
        List<String> categories = List.of("CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES").contains(normalized)
                ? List.of("CAPS", "ACCESSORIES")
                : List.of(normalized);

        boolean hasSubcategory = subcategory != null && !subcategory.trim().isEmpty();
        String subcategoryPattern = hasSubcategory ? "^" + java.util.regex.Pattern.quote(subcategory.trim()) + "$" : null;
        Flux<Trend> trendsFlux;
        if ("ALL".equals(normalizedAudience)) {
            trendsFlux = hasSubcategory
                    ? trendRepository.findByCategoryAndSubcategory(categories, subcategoryPattern, pageable)
                    : trendRepository.findByCategory(categories, pageable);
        } else {
            List<String> audiences = "UNISEX".equals(normalizedAudience)
                    ? List.of("UNISEX") : List.of(normalizedAudience, "UNISEX");
            // Audience is normalized by the database query before skip/limit.
            // Products without a specific audience are shared in both filters.
            trendsFlux = hasSubcategory
                    ? trendRepository.findByCategoryAndSubcategoryAndAudience(categories, subcategoryPattern, audiences, pageable)
                    : trendRepository.findByCategoryAndAudience(categories, audiences, pageable);
        }

        return trendsFlux
                .collectList()
                .map(trends -> {
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("content", trends);
                    result.put("category", normalized);
                    result.put("audience", normalizedAudience);
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
