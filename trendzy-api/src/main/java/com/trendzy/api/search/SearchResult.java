package com.trendzy.api.search;

import com.trendzy.api.model.Trend;
import java.util.List;

/** Response of GET /api/v2/search. Content has the same shape as the lane feed. */
public record SearchResult(String query, List<Brand> brands, List<Style> styles, List<Trend> content,
                           long totalElements, boolean hasMore, int page, int size, String audience) {
    public record Brand(String name, long count) {}

    /** A null label means the whole lane. */
    public record Style(String category, String label, long count) {}
}
