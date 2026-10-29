package com.trendzy.api.repository;

import com.trendzy.api.model.Trend;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface TrendRepository extends ReactiveMongoRepository<Trend, String> {

    String VISIBLE = "'active': { '$ne': false }, '$or': [ { 'enrichmentStatus': 'COMPLETED' }, { 'enrichmentStatus': { '$in': ['PARTIAL', 'AWAITING_UNDERDOG', 'PENDING', 'IN_PROGRESS', 'PROCESSING', 'FAILED'] }, 'signalProducts.underdog.shopUrl': { '$type': 'string', '$ne': '' }, 'signalProducts.underdog.imageUrl': { '$type': 'string', '$ne': '' } } ]";
    String FEED_SORT = "{ 'trendScore': -1, 'jeansFitPriority': -1, 'lastUpdatedAt': -1, '_id': 1 }";
    // Normalize in Mongo before pagination, including older documents without audience.
    String AUDIENCE_VALUE = "{ '$toUpper': { '$trim': { 'input': { '$convert': { 'input': '$signalProducts.underdog.audience', 'to': 'string', 'onError': '', 'onNull': '' } } } } }";
    String EFFECTIVE_AUDIENCE = "{ '$cond': [ { '$in': [ " + AUDIENCE_VALUE + ", ['MEN', 'WOMEN'] ] }, " + AUDIENCE_VALUE + ", 'UNISEX' ] }";

    @Query("{ 'signalProducts.underdog.brandName': ?0 }")
    Flux<Trend> findByBrandName(String brandName);

    // Filter before pagination so each page contains the requested audience and style.
    @Query(value = "{ 'category': { '$in': ?0 }, " + VISIBLE + " }", sort = FEED_SORT)
    Flux<Trend> findByCategory(List<String> categories, Pageable pageable);

    @Query(value = "{ 'category': { '$in': ?0 }, 'subcategory': { '$regex': ?1, '$options': 'i' }, " + VISIBLE + " }", sort = FEED_SORT)
    Flux<Trend> findByCategoryAndSubcategory(List<String> categories, String subcategory, Pageable pageable);

    @Query(value = "{ 'category': { '$in': ?0 }, '$expr': { '$in': [ " + EFFECTIVE_AUDIENCE + ", ?1 ] }, " + VISIBLE + " }", sort = FEED_SORT)
    Flux<Trend> findByCategoryAndAudience(List<String> categories, List<String> audiences, Pageable pageable);

    @Query(value = "{ 'category': { '$in': ?0 }, 'subcategory': { '$regex': ?1, '$options': 'i' }, '$expr': { '$in': [ " + EFFECTIVE_AUDIENCE + ", ?2 ] }, " + VISIBLE + " }", sort = FEED_SORT)
    Flux<Trend> findByCategoryAndSubcategoryAndAudience(List<String> categories, String subcategory, List<String> audiences, Pageable pageable);

    /** Never hydrate large scraper pools/marketplace stories to revalidate an outfit. */
    @Query(value = "{ '_id': { '$in': ?0 } }", fields = "{ 'category': 1, 'subcategory': 1, 'active': 1, 'enrichmentStatus': 1, 'signalProducts.underdog': 1 }")
    Flux<Trend> findCurrentOutfitMembers(List<String> ids);

}
