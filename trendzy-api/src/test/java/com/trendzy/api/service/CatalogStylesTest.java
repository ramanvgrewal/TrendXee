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

    @Test void specificClothingTypesStaySeparate() {
        assertEquals("washed", CatalogStyles.classify("TEES", "Vintage-Wash Tees"));
        assertEquals("graphic", CatalogStyles.classify("TEES", "Classical Mythology Tees"));
        assertEquals("oversized", CatalogStyles.classify("TEES", "Oversized Graphic Tees"));
        assertEquals("hoodies", CatalogStyles.classify("ANIME", "Embroidered Anime Hoodies"));
        assertEquals("knitwear", CatalogStyles.classify("OUTERWEAR", "Crochet Cardigan"));
        assertEquals("knitwear", CatalogStyles.classify("OUTERWEAR", "Knitted Vest"));
        assertEquals("overshirts", CatalogStyles.classify("OUTERWEAR", "Cotton Overshirt"));
        assertEquals("joggers", CatalogStyles.classify("BOTTOMS", "Trackpants"));
        assertEquals("sweatpants", CatalogStyles.classify("BOTTOMS", "Sweatpants"));
        assertEquals("gym", CatalogStyles.classify("SPORTSWEAR", "Women's Performance Tanks"));
        assertEquals("regular", CatalogStyles.classify("POLOS", "Regular-Fit Graphic T-Shirt"));
        assertEquals("regular", CatalogStyles.classify("TEES", "Regular-Fit Graphic T-Shirt"));
        assertEquals("polos", CatalogStyles.classify("TEES", "Oversized Polos"));
        assertEquals("sandals", CatalogStyles.classify("SHOES", "Sandals"));
        assertEquals("", CatalogStyles.classify("SHOES", "Women's Juttis & Flats"));
        assertEquals("", CatalogStyles.classify("SHOES", "Unisex Clogs & Slides"));
        assertEquals("", CatalogStyles.classify("CAPS", "Bags"));
        assertEquals("", CatalogStyles.classify("CAPS", "Earrings"));
        assertEquals("pendants", CatalogStyles.classify("CAPS", "Silver Pendant"));
        assertEquals(List.of("sports", "sneakers", "sandals"),
                CatalogStyles.options("SHOES", List.of()).stream().map(CatalogStyles.Option::id).toList());
        assertEquals(List.of("caps", "rings", "pendants", "bracelets", "watches"),
                CatalogStyles.options("CAPS", List.of()).stream().map(CatalogStyles.Option::id).toList());
    }

    @Test void shortsHaveASeparateBottomsLaneBeforeIngestion() {
        assertEquals(List.of(new CatalogStyles.Option("joggers", "Joggers"),
                new CatalogStyles.Option("sweatpants", "Sweatpants"), new CatalogStyles.Option("shorts", "Shorts")),
                CatalogStyles.options("BOTTOMS", List.of()));
        assertEquals("shorts", CatalogStyles.classify("BOTTOMS", "Cargo Shorts"));
        assertEquals("shorts", CatalogStyles.classify("BOTTOMS", "Track Shorts"));
        assertEquals("joggers", CatalogStyles.classify("BOTTOMS", "Short Inseam Trackpants"));
    }

    @Test void shirtsUseBroadStylesAndCheckTheActualProductBeforePagination() {
        assertEquals("printed", CatalogStyles.classify("SHIRTS", "Ajrakh Printed Shirt"));
        assertEquals("printed", CatalogStyles.classify("SHIRTS", "Block-Printed Shirt"));
        assertEquals("embroidered", CatalogStyles.classify("SHIRTS", "Hand-Embroidered Shirt"));
        assertEquals("embroidered", CatalogStyles.classify("SHIRTS", "Chikankari Shirt"));
        assertEquals(List.of("printed", "embroidered"),
                CatalogStyles.options("SHIRTS", List.of("Ajrakh Printed Shirt", "Block-Printed Shirt", "Chikankari Shirt"))
                        .stream().map(CatalogStyles.Option::id).toList());
        var filtered = CatalogFilterQuery.build("SHIRTS", "WOMEN", "Printed Shirts", null, null).getQueryObject();
        assertEquals("Printed Shirts", filtered.getString("subcategory"));
        assertTrue(filtered.toJson().contains("UNISEX"));
    }

    @Test void groupAndAudienceAreBothAppliedBeforePaginationAndUnrelatedLanesAreRejected() {
        var query = CatalogFilterQuery.build("JEANS", "WOMEN", null, null, null, "baggy-jeans");
        assertEquals("Baggy Jeans", query.getQueryObject().getString("subcategory"));
        assertTrue(query.getQueryObject().toJson().contains("UNISEX"));
        assertEquals(12, CatalogFilterQuery.page(query, 1, 12).getSkip());
        assertEquals(List.of(), CatalogFilterQuery.build("TEES", "ALL", "Baggy Jeans", null, null)
                .getQueryObject().get("subcategory", Document.class).getList("$in", String.class));
    }
}
