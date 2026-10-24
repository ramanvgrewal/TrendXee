package com.trendzy.api.model;

import java.util.Locale;

/** Product discovery audience. Products without a specific audience are shared. */
public final class ProductAudience {
    private ProductAudience() {}

    public static String normalize(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return normalized.equals("MEN") || normalized.equals("WOMEN") ? normalized : "UNISEX";
    }
}
