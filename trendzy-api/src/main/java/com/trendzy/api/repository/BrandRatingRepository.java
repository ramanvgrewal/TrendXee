package com.trendzy.api.repository;

import com.trendzy.api.model.BrandRating;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface BrandRatingRepository extends ReactiveMongoRepository<BrandRating, String> {
}
