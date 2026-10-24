package com.trendzy.api.service;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Product identity excludes campaign/variant aliases but preserves query-based product IDs. */
public final class ProductIdentity {
    private static final Set<String> PRODUCT_QUERY_KEYS = Set.of("id", "pid", "productid", "product_id");

    private ProductIdentity() {}

    public static boolean isProductUrl(String input) {
        String identity = canonical(input);
        if (identity.isEmpty()) return false;
        URI uri = URI.create(identity);
        String path = uri.getPath();
        boolean hasProductId = uri.getQuery() != null && Arrays.stream(uri.getQuery().split("&"))
                .anyMatch(part -> part.contains("=") && !part.substring(part.indexOf('=') + 1).isBlank());
        if (path == null || path.isBlank() || path.equals("/")) return hasProductId;
        if (path.matches("/(?:collections|categories|category|catalog|search|pages|blogs|cart|checkout|account)(?:/.*)?")) return false;
        return !path.matches("/(?:products?|shop|all|home)(?:\\.php|\\.html)?") || hasProductId;
    }

    public static String canonical(String input) {
        if (input == null || input.isBlank()) return "";
        try {
            URI uri = URI.create(input.trim().replace("&amp;", "&"));
            if (!Set.of("http", "https").contains(String.valueOf(uri.getScheme()).toLowerCase(Locale.ROOT))
                    || uri.getHost() == null || uri.getUserInfo() != null) return "";
            String host = uri.getHost().toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
            String path = uri.normalize().getRawPath();
            if (path == null || path.isBlank()) path = "/";
            // Shopify exposes the same product through collection-specific paths.
            path = path.replaceFirst("^/collections/[^/]+(/products/)", "$1")
                    .replaceAll("/{2,}", "/").replaceFirst("/+$", "").toLowerCase(Locale.ROOT);
            String query = uri.getRawQuery() == null ? "" : Arrays.stream(uri.getRawQuery().split("&"))
                    .filter(part -> PRODUCT_QUERY_KEYS.contains(URLDecoder.decode(part.split("=", 2)[0],
                            StandardCharsets.UTF_8).toLowerCase(Locale.ROOT)))
                    .sorted().collect(Collectors.joining("&"));
            return "https://" + host + (uri.getPort() > 0 && uri.getPort() != 80 && uri.getPort() != 443 ? ":" + uri.getPort() : "")
                    + path + (query.isEmpty() ? "" : "?" + query);
        } catch (IllegalArgumentException e) {
            return "";
        }
    }
}
