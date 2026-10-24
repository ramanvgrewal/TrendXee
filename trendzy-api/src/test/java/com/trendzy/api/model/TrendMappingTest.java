package com.trendzy.api.model;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import java.util.Date;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class TrendMappingTest {
    @Test void galleriesAndBothTimestampFormatsCanBeRead() throws Exception {
        MongoMappingContext context = new MongoMappingContext();
        var conversions = new org.springframework.data.mongodb.core.convert.MongoCustomConversions(List.of());
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        MappingMongoConverter converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setCustomConversions(conversions);
        converter.afterPropertiesSet();
        for (Object timestamp : List.of(1700000000000L, new Date(1700000000000L))) {
            Document source = new Document("trendScoreUpdatedAt", timestamp)
                    .append("productSelectionFocus", "Women's Badminton & Cricket Sports Shoes")
                    .append("productRefreshedAt", timestamp).append("lastProductRefreshAttemptAt", timestamp)
                    .append("lastProductRefreshStatus", "UPDATED")
                    .append("signalProducts", new Document("underdog", new Document("imageUrl", "https://store/front.jpg")
                            .append("audience", "UNISEX").append("audienceSource", "retailer:tags")
                            .append("gender", "Unisex").append("tags", List.of("Gender_Unisex"))
                            .append("availability", "UNKNOWN").append("stockCheckedAt", new Date(1700000000000L))
                            .append("colors", List.of("BLACK")).append("fit", "REGULAR")
                            .append("variantId", 123456789L).append("selectedVariantId", "123456789")
                            .append("curationReason", "Retailer-verified product role.")
                            .append("outfitProfile", new Document("version", 1).append("role", "TOP"))
                            .append("retailerAudience", new Document("suggestedGender", "unisex"))
                            .append("target_gender", List.of("male", "female"))
                            .append("imageUrls", List.of("https://store/front.jpg", "https://store/back.jpg"))));
            Trend trend = converter.read(Trend.class, source);
            assertNotNull(trend.getTrendScoreUpdatedAt());
            assertEquals(2, trend.getSignalProducts().getUnderdog().getImageUrls().size());
            assertEquals("UNISEX", trend.getSignalProducts().getUnderdog().getAudience());
            assertEquals("retailer:tags", trend.getSignalProducts().getUnderdog().getAudienceSource());
            assertEquals(List.of("Gender_Unisex"), trend.getSignalProducts().getUnderdog().getTags());
            assertEquals("UNKNOWN", trend.getSignalProducts().getUnderdog().getAvailability());
            assertNotNull(trend.getSignalProducts().getUnderdog().getStockCheckedAt());
            assertEquals(List.of("BLACK"), trend.getSignalProducts().getUnderdog().getColors());
            assertEquals("TOP", trend.getSignalProducts().getUnderdog().getOutfitProfile().get("role"));
            Document persisted = new Document();
            converter.write(trend, persisted);
            assertEquals(source.get("productSelectionFocus"), persisted.get("productSelectionFocus"));
            assertEquals(timestamp, persisted.get("productRefreshedAt"));
            assertEquals(timestamp, persisted.get("lastProductRefreshAttemptAt"));
            assertEquals("UPDATED", persisted.get("lastProductRefreshStatus"));
            Document selected = persisted.get("signalProducts", Document.class).get("underdog", Document.class);
            Document original = source.get("signalProducts", Document.class).get("underdog", Document.class);
            original.forEach((field, value) -> assertEquals(value, selected.get(field), field));
            assertEquals(List.of("male", "female"), trend.getSignalProducts().getUnderdog().getTargetGenderLegacy());
            assertEquals("unisex", ((java.util.Map<?, ?>) trend.getSignalProducts().getUnderdog().getRetailerAudience()).get("suggestedGender"));
        }
    }
}
