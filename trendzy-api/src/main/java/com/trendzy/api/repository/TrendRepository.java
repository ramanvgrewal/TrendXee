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

    @Query("{ 'signalProducts.underdog.brandName': ?0 }")
    Flux<Trend> findByBrandName(String brandName);

    // Infinite scroll using Flux
    @Query(value = "{ 'category': { '$in': ?0 }, 'active': { '$ne': false }, '$or': [ { 'enrichmentStatus': 'COMPLETED' }, { 'enrichmentStatus': { '$in': ['PARTIAL', 'AWAITING_UNDERDOG', 'PENDING', 'IN_PROGRESS', 'PROCESSING', 'FAILED'] }, 'signalProducts.underdog.shopUrl': { '$type': 'string', '$ne': '' }, 'signalProducts.underdog.imageUrl': { '$type': 'string', '$ne': '' } } ] }",
        sort = "{ 'trendScore': -1, 'lastUpdatedAt': -1, '_id': 1 }")
    Flux<Trend> findByCategory(List<String> categories, Pageable pageable);

    @Query(value = "{ 'category': { '$in': ?0 }, 'subcategory': { '$regex': ?1, '$options': 'i' }, 'active': { '$ne': false }, '$or': [ { 'enrichmentStatus': 'COMPLETED' }, { 'enrichmentStatus': { '$in': ['PARTIAL', 'AWAITING_UNDERDOG', 'PENDING', 'IN_PROGRESS', 'PROCESSING', 'FAILED'] }, 'signalProducts.underdog.shopUrl': { '$type': 'string', '$ne': '' }, 'signalProducts.underdog.imageUrl': { '$type': 'string', '$ne': '' } } ] }",
        sort = "{ 'trendScore': -1, 'lastUpdatedAt': -1, '_id': 1 }")
    Flux<Trend> findByCategoryAndSubcategory(List<String> categories, String subcategory, Pageable pageable);

    // Delete trends by category with score less than a threshold
    Mono<Long> deleteByCategoryAndTrendScoreLessThan(String category, double maxScore);

    // Delete trends that haven't been updated since a specific date
    Mono<Long> deleteByLastUpdatedAtBefore(LocalDateTime date);
}
