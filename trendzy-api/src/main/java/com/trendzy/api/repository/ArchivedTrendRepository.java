package com.trendzy.api.repository;

import com.trendzy.api.model.ArchivedTrend;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ArchivedTrendRepository extends ReactiveMongoRepository<ArchivedTrend, String> {
    
    Flux<ArchivedTrend> findByUserIdOrderByArchivedAtDesc(String userId);

    Mono<ArchivedTrend> findByUserIdAndOriginalTrendId(String userId, String originalTrendId);

    Mono<Void> deleteByUserIdAndOriginalTrendId(String userId, String originalTrendId);
}
