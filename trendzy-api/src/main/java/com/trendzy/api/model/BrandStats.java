package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "brand_stats")
public class BrandStats {
    @Id
    private String brandName;
    @Builder.Default
    private Double userRatingAverage = 0.0;
    @Builder.Default
    private Integer userRatingCount = 0;
}
