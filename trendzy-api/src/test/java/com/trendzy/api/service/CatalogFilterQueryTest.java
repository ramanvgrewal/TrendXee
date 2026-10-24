package com.trendzy.api.service;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class CatalogFilterQueryTest {
    @Test void combinedFiltersPreserveVisibilityAndUseSelectedSellingPrice() {
        var query = CatalogFilterQuery.build("jeans", "women", "Baggy.*", 1000.0, 1999.99);
        var criteria = query.getQueryObject();
        assertEquals(List.of("JEANS"), criteria.get("category", Document.class).get("$in"));
        assertEquals(false, criteria.get("active", Document.class).get("$ne"));
        assertNotNull(criteria.get("$or"));
        assertEquals("^\\QBaggy.*\\E$", criteria.get("subcategory", Document.class).get("$regex"));
        var price = criteria.get("signalProducts.underdog.price", Document.class);
        assertEquals(1000.0, price.get("$gte"));
        assertEquals(1999.99, price.get("$lte"));
        assertFalse(criteria.containsKey("estimatedPrice"));
        var audience = criteria.get("$expr", Document.class).getList("$in", Object.class);
        assertEquals(List.of("WOMEN", "UNISEX"), audience.get(1));
        assertTrue(audience.get(0).toString().contains("$cond"));
        assertTrue(audience.get(0).toString().contains("$convert"));
        assertFalse(criteria.get("signalProducts.underdog.currency", Document.class).getList("$in", Object.class).contains("USD"));
    }

    @Test void paginationKeepsFiltersAndSortsHypeBeforeFitPreferenceWithoutMutatingCountQuery() {
        var base = CatalogFilterQuery.build("JEANS", "MEN", "Baggy Jeans", null, 1000.0);
        var paged = CatalogFilterQuery.page(base, 2, 12);
        assertEquals(24, paged.getSkip());
        assertEquals(12, paged.getLimit());
        assertEquals(base.getQueryObject(), paged.getQueryObject());
        assertEquals(List.of("trendScore", "jeansFitPriority", "lastUpdatedAt", "_id"), List.copyOf(paged.getSortObject().keySet()));
        assertEquals(-1, paged.getSortObject().get("trendScore"));
        assertEquals(0, base.getSkip());
        assertEquals(0, base.getLimit());
    }

    @Test void categoryAliasesAndUnfilteredMissingPricesStayCompatible() {
        var caps = CatalogFilterQuery.build("Caps & Accessories", "ALL", null, null, null).getQueryObject();
        assertEquals(List.of("CAPS", "ACCESSORIES"), caps.get("category", Document.class).get("$in"));
        assertFalse(caps.containsKey("signalProducts.underdog.price"));
        assertFalse(caps.containsKey("$expr"));
        assertEquals(List.of("SNEAKERS"), CatalogFilterQuery.build("Shoes", "ALL", null, null, null)
                .getQueryObject().get("category", Document.class).get("$in"));
    }

    @Test void invalidBudgetsAndAudienceAreRejected() {
        for (Double invalid : List.of(-1.0, Double.NaN, Double.POSITIVE_INFINITY)) {
            assertThrows(ResponseStatusException.class, () -> CatalogFilterQuery.build("TEES", "ALL", null, invalid, null));
            assertThrows(ResponseStatusException.class, () -> CatalogFilterQuery.build("TEES", "ALL", null, null, invalid));
        }
        assertThrows(ResponseStatusException.class, () -> CatalogFilterQuery.build("TEES", "ALL", null, 2000.0, 1000.0));
        assertThrows(ResponseStatusException.class, () -> CatalogFilterQuery.build("TEES", "other", null, null, null));
    }
}
