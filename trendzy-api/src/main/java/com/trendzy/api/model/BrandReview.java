package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "brand_reviews")
public class BrandReview {
    @Id
    private String id;
    private String brandName;
    private String userId;
    private String comment;
    private LocalDateTime createdAt;
}
