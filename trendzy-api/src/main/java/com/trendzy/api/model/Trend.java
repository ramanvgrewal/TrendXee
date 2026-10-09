package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "trends")
public class Trend {
    @Id
    private String id;

    @Field("name")
    private String trendName;

    private String category;
    private String subcategory;

    private double trendScore;
    private String brandInstagramHandle;
    private Long trendScoreUpdatedAt;
    private BrandHypeSignals brandHypeSignals;


    private String tier;
    private List<String> vibeTags;

    private String aiSummary;
    private List<String> whyTrending;
    private String indiaRelevanceNote;
    private boolean indiaRelevant;

    private long totalSignals;

    @Field("supportingSignals")
    private List<String> supportingSignalIds;

    private String enrichmentStatus;
    private String enrichmentQuery;
    private List<String> aiBrandNames;

    // Product triad (underdog + amazon + flipkart)
    @Builder.Default
    private SignalProducts signalProducts = new SignalProducts();

    private double estimatedPrice;
    private String currency;
    private LocalDateTime firstDetectedAt;
    private LocalDateTime lastUpdatedAt;

    @Builder.Default
    private boolean active = true;

    private Double underdogRating;
    private java.util.Map<String, Object> ratingSignals;
    @Builder.Default
    private Double userRatingAverage = 0.0;
    @Builder.Default
    private Integer userRatingCount = 0;

    // Bucket for supporting signal products
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BrandHypeSignals {
        private Integer followers;
        private Double engagementRate;
        private Double postsPerWeek;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignalProducts {
        private String signalId;
        private String authorUsername;
        private String queryUsed;          // debug: keywords fed to Amazon/Flipkart
        private ProductDetail underdog;    // creator store product (nullable)
        private ProductDetail amazon;      // marketplace aesthetic match (nullable)
        private ProductDetail flipkart;    // marketplace aesthetic match (nullable)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductDetail {
        private String brandName;
        private String title;
        private String currency;
        private Double price;
        private Double originalPrice;
        private String priceType;
        private String shopUrl;
        private String imageUrl;
        private Boolean codAvailable;
    }
}


