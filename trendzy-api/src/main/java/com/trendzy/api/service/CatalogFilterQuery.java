package com.trendzy.api.service;

import com.trendzy.api.repository.TrendRepository;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** Shared catalog visibility and audience rules, applied before pagination. */
public final class CatalogFilterQuery {
    private CatalogFilterQuery() {}

    public static Query build(String category, String audience, String subcategory, Double minPrice, Double maxPrice) {
        return build(category, audience, subcategory, minPrice, maxPrice, null);
    }

    public static Query build(String category, String audience, String subcategory, Double minPrice, Double maxPrice, String style) {
        if ((minPrice != null && (!Double.isFinite(minPrice) || minPrice < 0))
                || (maxPrice != null && (!Double.isFinite(maxPrice) || maxPrice < 0))
                || (minPrice != null && maxPrice != null && minPrice > maxPrice)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price bounds must be finite, non-negative and minPrice <= maxPrice");
        }
        String normalizedAudience = audience == null ? "ALL" : audience.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ALL", "MEN", "WOMEN", "UNISEX").contains(normalizedAudience)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "audience must be ALL, MEN, WOMEN or UNISEX");
        }
        String normalized = category.trim().toUpperCase(Locale.ROOT);
        if (List.of("SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS", "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS").contains(normalized)) normalized = "SNEAKERS";
        List<String> categories = List.of("CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES").contains(normalized)
                ? List.of("CAPS", "ACCESSORIES") : List.of(normalized);
        Document criteria = Document.parse("{" + TrendRepository.VISIBLE + "}");
        criteria.put("category", new Document("$in", categories));
        if (!"ALL".equals(normalizedAudience)) {
            List<String> audiences = "UNISEX".equals(normalizedAudience) ? List.of("UNISEX") : List.of(normalizedAudience, "UNISEX");
            criteria.put("$expr", new Document("$in", List.of(Document.parse(TrendRepository.EFFECTIVE_AUDIENCE), audiences)));
        }
        if (subcategory != null && !subcategory.isBlank()) {
            criteria.put("subcategory", new Document("$regex", "^" + Pattern.quote(subcategory.trim()) + "$").append("$options", "i"));
        }
        if (style != null && !style.isBlank()) {
            Document family = CatalogStyles.match(category, style.trim());
            Object audienceExpression = criteria.get("$expr");
            criteria.put("$expr", audienceExpression == null ? family : new Document("$and", List.of(audienceExpression, family)));
        }
        if (minPrice != null || maxPrice != null) {
            // Filter the selected product's selling price, never its MRP or the trend estimate.
            Document bounds = new Document("$type", "number").append("$gt", 0);
            if (minPrice != null) bounds.append("$gte", minPrice);
            if (maxPrice != null) bounds.append("$lte", maxPrice);
            criteria.put("signalProducts.underdog.price", bounds);
            // Rupee budgets must not treat a foreign-currency amount as INR.
            criteria.put("signalProducts.underdog.currency", new Document("$in", java.util.Arrays.asList(
                    null, "", "INR", "inr", "Rs", "Rs.", "RS", "RS.", "₹", "RUPEES", "rupees")));
        }
        return new BasicQuery(criteria);
    }

    public static Query page(Query criteria, int page, int size) {
        return Query.of(criteria).with(Sort.by(Sort.Direction.DESC, "trendScore", "jeansFitPriority", "lastUpdatedAt")
                .and(Sort.by(Sort.Direction.ASC, "_id"))).skip((long) page * size).limit(size);
    }
}
