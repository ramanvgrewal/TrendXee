package com.trendzy.api.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public final class ApprovedTaxonomy {
    private static final Map<String, List<Object>> LANES = load();

    private ApprovedTaxonomy() {}

    private static Map<String, List<Object>> load() {
        try (var input = ApprovedTaxonomy.class.getResourceAsStream("/taxonomy.json")) {
            return new ObjectMapper().readValue(input, new TypeReference<>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Cannot load approved taxonomy", e);
        }
    }

    public static List<String> labels(String category) {
        var lane = LANES.get(category);
        if (lane == null) return List.of();
        return ((List<?>) lane.get(1)).stream().map(String.class::cast).toList();
    }
    public static String styleId(String label) {
        return label.toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
