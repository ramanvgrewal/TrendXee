package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** One rating per user per brand; a later rating replaces the earlier one. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "brand_ratings")
public class BrandRating {
    @Id
    private String id; // userId + "|" + rating key
    private String userId;
    private String ratingKey; // brand name, or "trend:<id>" when a product has no brand
    private int rating;
    private Instant updatedAt;

    public static String idFor(String userId, String ratingKey) {
        return userId + "|" + ratingKey;
    }
}
