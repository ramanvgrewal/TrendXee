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
                    .append("signalProducts", new Document("underdog", new Document("imageUrl", "https://store/front.jpg")
                            .append("imageUrls", List.of("https://store/front.jpg", "https://store/back.jpg"))));
            Trend trend = converter.read(Trend.class, source);
            assertNotNull(trend.getTrendScoreUpdatedAt());
            assertEquals(2, trend.getSignalProducts().getUnderdog().getImageUrls().size());
        }
    }
}
