package com.trendzy.api.repository;

import com.trendzy.api.model.FeaturedPick;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

public interface FeaturedPickRepository extends ReactiveMongoRepository<FeaturedPick, String> {
    Flux<FeaturedPick> findByDateGreaterThanEqualOrderByDateAsc(String date);
}
