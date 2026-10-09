package com.trendzy.api.repository;

import com.trendzy.api.model.BrandStats;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface BrandStatsRepository extends ReactiveMongoRepository<BrandStats, String> {
}
