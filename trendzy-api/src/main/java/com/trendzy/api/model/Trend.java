package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "trends")
@CompoundIndexes({
    @CompoundIndex(name = "category_enrichment_score_idx", def = "{ 'category': 1, 'enrichmentStatus': 1, 'trendScore': -1, 'lastUpdatedAt': -1 }"),
    @CompoundIndex(name = "category_subcat_score_idx", def = "{ 'category': 1, 'subcategory': 1, 'enrichmentStatus': 1, 'trendScore': -1, 'lastUpdatedAt': -1 }")
})
public class Trend {
    @Id
    private String id;

    @Field("name")
    private String trendName;

    private String category;
    private String subcategory;
    private String productSelectionFocus;
    private Object productRefreshedAt;
    private Object lastProductRefreshAttemptAt;
    private String lastProductRefreshStatus;

    private double trendScore;
    private String brandInstagramHandle;
    // Legacy records use epoch milliseconds; current scraper writes BSON dates.
    private Object trendScoreUpdatedAt;
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

    // Selected retailer product and optional marketplace comparisons.
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

    // Instagram inputs shown in the brand hype section.
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
        private String queryUsed;
        private ProductDetail underdog;
        private ProductDetail amazon;
        private ProductDetail flipkart;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductDetail {
        private String brandName;
        private String title;
        /** Discovery audience: MEN, WOMEN or UNISEX; legacy unknown values are shared. */
        private String audience;
        private String audienceSource;

        public String getAudience() {
            return ProductAudience.normalize(audience);
        }

        public String getAudienceSource() {
            if (audienceSource != null && !audienceSource.isBlank()) return audienceSource;
            return audience == null || !java.util.Set.of("MEN", "WOMEN", "UNISEX")
                    .contains(audience.trim().toUpperCase(java.util.Locale.ROOT))
                    ? "default:unknown-as-unisex" : audienceSource;
        }

        private String gender;
        private Object targetGender;
        @Field("target_gender")
        @com.fasterxml.jackson.annotation.JsonProperty("target_gender")
        private Object targetGenderLegacy;
        private Object retailerAudience;
        private String productType;
        private String description;
        private List<String> tags;
        private Object color;
        private Object colors;
        private Object pattern;
        private Object fit;
        private Object material;
        private Object materials;
        private Object variantId;
        private Object selectedVariantId;
        private Object variantTitle;
        /** Current-product evidence, never trend-level styling from an earlier pick. */
        private java.util.Map<String, Object> outfitProfile;
        private String availability;
        private String availabilitySource;
        private Object stockCheckedAt;
        private Boolean available;
        private Boolean inStock;
        private String curationReason;
        private String currency;
        private Double price;
        private Double originalPrice;
        private String priceType;
        private String shopUrl;
        private String imageUrl;
        private List<String> imageUrls;
        private Boolean codAvailable;
    }
}


