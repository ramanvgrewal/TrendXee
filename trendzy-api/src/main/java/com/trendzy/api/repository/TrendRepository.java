package com.trendzy.api.repository;

import com.trendzy.api.model.Trend;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrendRepository extends ReactiveMongoRepository<Trend, String> {

    // Infinite scroll using Flux
        @Query(value = "{ 'category': { '$in': ?0 }, 'enrichmentStatus': 'COMPLETED' }",
            sort = "{ 'trendScore': -1, 'lastUpdatedAt': -1 }")
        Flux<Trend> findByCategory(List<String> categories, Pageable pageable);

    // Delete trends by category with score less than a threshold
    Mono<Long> deleteByCategoryAndTrendScoreLessThan(String category, double maxScore);

    // Delete trends that haven't been updated since a specific date
    Mono<Long> deleteByLastUpdatedAtBefore(LocalDateTime date);
}
