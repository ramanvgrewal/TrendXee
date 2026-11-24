package com.trendzy.api.search;

import com.trendzy.api.model.ApprovedTaxonomy;
import com.trendzy.api.model.Trend;
import com.trendzy.api.service.CatalogFilterQuery;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Keeps the search index in memory. A failed refresh leaves the previous index serving. */
@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {
    static final Duration REFRESH_EVERY = Duration.ofMinutes(5);
    /** How soon admin edits show up, and how soon a failed load is retried. */
    private static final Duration CHECK_EVERY = Duration.ofSeconds(2);
    private static final Duration RETRY_AFTER = Duration.ofSeconds(15);
    private static final Duration LOAD_TIMEOUT = Duration.ofSeconds(30);

    private final ReactiveMongoTemplate mongoTemplate;
    private volatile SearchIndex index;
    private volatile long nextRefresh = System.nanoTime();
    private Disposable refreshing;

    @EventListener(ApplicationReadyEvent.class)
    void start() {
        refreshing = Flux.interval(Duration.ZERO, CHECK_EVERY)
                .onBackpressureDrop()
                .concatMap(tick -> System.nanoTime() - nextRefresh >= 0 ? refresh() : Mono.empty(), 1)
                .subscribe();
    }

    @PreDestroy
    void stop() {
        if (refreshing != null) refreshing.dispose();
    }

    /** Called after an admin edit. Edits made during a load cause another load. */
    public void requestRefresh() {
        nextRefresh = System.nanoTime();
    }

    Mono<Void> refresh() {
        return Mono.defer(() -> {
            // Set before loading so a request made meanwhile is not lost.
            nextRefresh = System.nanoTime() + REFRESH_EVERY.toNanos();
            return Flux.fromIterable(ApprovedTaxonomy.categories())
                    .concatMap(category -> mongoTemplate.find(
                            CatalogFilterQuery.build(category, "ALL", null, null, null), Trend.class))
                    .collectList()
                    .timeout(LOAD_TIMEOUT)
                    .doOnNext(trends -> {
                        index = new SearchIndex(trends);
                        log.info("[SEARCH] Indexed {} products", index.size());
                    })
                    .then();
        }).onErrorResume(error -> {
            nextRefresh = System.nanoTime() + RETRY_AFTER.toNanos();
            log.error("[SEARCH] Refresh failed; {}", index == null ? "no index yet" : "keeping the previous index", error);
            return Mono.empty();
        });
    }

    SearchResult search(String query, String audience, int page, int size) {
        SearchIndex current = index;
        if (current == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Search is starting");
        return current.search(query, audience, page, size);
    }
}
