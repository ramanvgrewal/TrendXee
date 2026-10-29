package com.trendzy.api.service;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class CatalogStylesTest {
    @Test void genderAndMarketingVariantsMergeIntoKnownJeansFamilies() {
        for (String label : List.of("Baggy Jeans", "Men's Baggy-Fit Jeans", "Women's Super Wide-Leg Jeans", "Wide Leg Jeans", "Relaxed-Fit Jeans", "Men's Parallel-Leg Baggy Jeans")) {
            assertEquals("baggy", CatalogStyles.classify("JEANS", label), label);
        }
        assertEquals("bootcut", CatalogStyles.classify("JEANS", "Men's Loose-Bootcut Jeans"));
        assertEquals("bootcut", CatalogStyles.classify("JEANS", "Women's High-Rise Flared Jeans"));
        assertEquals("cargo", CatalogStyles.classify("JEANS", "Baggy Denim Cargo Jeans"));
        assertEquals("mom", CatalogStyles.classify("JEANS", "Women's Mom-Fit Jeans"));
        assertEquals("straight", CatalogStyles.classify("JEANS", "Mid-Rise Straight Jeans"));
        assertEquals(1, CatalogStyles.options("JEANS", List.of("Baggy Jeans", "Wide Leg Jeans", "Men's Baggy-Fit Jeans")).size());
        assertEquals("baggy", CatalogStyles.options("JEANS", List.of("Cargo Jeans", "Bootcut Jeans", "Baggy Jeans")).get(0).id());
    }

    @Test void lanesHaveAtMostFiveFamiliesAndSpecificClothingTypesStaySeparate() {
        for (String category : List.of("TEES", "OUTERWEAR", "JEANS", "BOTTOMS", "ANIME", "SHOES", "SPORTSWEAR", "POLOS", "CAPS")) {
            assertTrue(CatalogStyles.groups(category).size() <= 5, category);
            assertFalse(CatalogStyles.groups(category).isEmpty(), category);
        }
        assertEquals("washed", CatalogStyles.classify("TEES", "Vintage-Wash Tees"));
        assertEquals("graphic", CatalogStyles.classify("TEES", "Classical Mythology Tees"));
        assertEquals("oversized", CatalogStyles.classify("TEES", "Oversized Graphic Tees"));
        assertEquals("hoodies", CatalogStyles.classify("ANIME", "Embroidered Anime Hoodies"));
        assertEquals("overshirts", CatalogStyles.classify("OUTERWEAR", "Crochet Cardigan"));
        assertEquals("overshirts", CatalogStyles.classify("OUTERWEAR", "Knitted Vest"));
        assertEquals("sweats", CatalogStyles.classify("BOTTOMS", "Trackpants"));
        assertEquals("gym", CatalogStyles.classify("SPORTSWEAR", "Women's Performance Tanks"));
        assertEquals("regular", CatalogStyles.classify("POLOS", "Regular-Fit Graphic T-Shirt"));
        assertEquals("sandals", CatalogStyles.classify("SHOES", "Unisex Clogs & Slides"));
        assertEquals("flats", CatalogStyles.classify("SHOES", "Women's Juttis & Flats"));
        assertEquals("caps", CatalogStyles.classify("CAPS", "Vintage"));
        assertEquals("jewellery", CatalogStyles.classify("CAPS", "Contemporary Silver Jewellery"));
    }

    @Test void groupAndAudienceAreBothAppliedBeforePaginationAndUnrelatedLanesAreRejected() {
        var query = CatalogFilterQuery.build("JEANS", "WOMEN", null, null, null, "baggy");
        var expression = query.getQueryObject().get("$expr", Document.class);
        assertEquals(2, expression.getList("$and", Document.class).size());
        assertTrue(expression.toJson().contains("$switch"));
        assertTrue(expression.toJson().contains("$regexMatch"));
        assertTrue(expression.toJson().contains("UNISEX"));
        assertFalse(query.getQueryObject().containsKey("subcategory"));
        assertEquals(12, CatalogFilterQuery.page(query, 1, 12).getSkip());
        assertThrows(ResponseStatusException.class, () -> CatalogFilterQuery.build("TEES", "ALL", null, null, null, "baggy"));
        assertThrows(ResponseStatusException.class, () -> CatalogStyles.match("JEANS", "anything.*"));
    }
}
