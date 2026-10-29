package com.trendzy.api.service;

import com.trendzy.api.model.Trend.ProductDetail;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

/** Shared contract with TrendZee outfits/catalog.py. Score updates do not change clothing. */
public final class OutfitFingerprint {
    private OutfitFingerprint() {}
    public static String of(ProductDetail p) {
        try {
            String content = String.join("\u001f", ProductIdentity.canonical(p.getShopUrl()), value(p.getTitle()),
                    value(p.getProductType()), value(p.getImageUrl()), value(p.getDescription()),
                    lines(p.getTags()), lines(p.getImageUrls()), p.getAudience());
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
    private static String lines(List<String> values) { return values == null ? "" : String.join("\n", values); }
    private static String value(String value) { return value == null ? "" : value; }
}
