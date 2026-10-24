package com.trendzy.api.model;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ProductAudienceTest {
    @Test void legacyUnclassifiedProductsBecomeShared() {
        for (String value : Arrays.asList(null, "", " ", "UNKNOWN", "unknown", "unclassified", "UNISEX")) {
            var product = Trend.ProductDetail.builder().audience(value).build();
            assertEquals("UNISEX", product.getAudience());
        }
    }

    @Test void knownAudiencesAndExistingEvidenceArePreserved() {
        for (String value : List.of("MEN", "WOMEN", "UNISEX")) {
            var product = Trend.ProductDetail.builder().audience(" " + value.toLowerCase() + " ")
                    .audienceSource("manual:product-override").build();
            assertEquals(value, product.getAudience());
            assertEquals("manual:product-override", product.getAudienceSource());
        }
        var legacy = Trend.ProductDetail.builder().audience("UNKNOWN").audienceSource("retailer:unclassified").build();
        assertEquals("UNISEX", legacy.getAudience());
        assertEquals("retailer:unclassified", legacy.getAudienceSource());
        assertEquals("default:unknown-as-unisex", Trend.ProductDetail.builder().build().getAudienceSource());
    }
}
