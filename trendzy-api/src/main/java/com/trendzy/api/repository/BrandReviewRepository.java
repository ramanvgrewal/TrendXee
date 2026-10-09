package com.trendzy.api.repository;

import com.trendzy.api.model.BrandReview;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface BrandReviewRepository extends ReactiveMongoRepository<BrandReview, String> {
    Flux<BrandReview> findByBrandNameOrderByCreatedAtDesc(String brandName);
}
