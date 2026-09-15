package com.trendzy.business.analytics;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "product_clicks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductClick {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String userId;    // nullable for anonymous
    private String trendId;
    private String source;    // "underdog", "amazon", "flipkart"
    private String url;
    
    @Builder.Default
    private Instant clickedAt = Instant.now();
}
