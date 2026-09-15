package com.trendzy.api.controller;

import com.trendzy.api.model.ArchivedTrend;
import com.trendzy.api.repository.ArchivedTrendRepository;
import com.trendzy.api.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v2/archive/trends")
@RequiredArgsConstructor
@Slf4j
public class ArchiveController {

    private final ArchivedTrendRepository archivedTrendRepository;
    private final TrendRepository trendRepository;

    private Mono<String> getAuthenticatedUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(context -> {
                    if (context.getAuthentication() == null || !context.getAuthentication().isAuthenticated() || "anonymousUser".equals(context.getAuthentication().getPrincipal())) {
                        return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated"));
                    }
                    return Mono.just((String) context.getAuthentication().getPrincipal());
                });
    }

    @GetMapping
    public Flux<ArchivedTrend> getArchivedTrends() {
        return getAuthenticatedUserId()
                .flatMapMany(userId -> archivedTrendRepository.findByUserIdOrderByArchivedAtDesc(userId));
    }

    @PostMapping("/{trendId}")
    public Mono<ArchivedTrend> archiveTrend(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> archivedTrendRepository.findByUserIdAndOriginalTrendId(userId, trendId)
                        .switchIfEmpty(Mono.defer(() -> trendRepository.findById(trendId)
                                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Trend not found")))
                                .flatMap(trend -> {
                                    ArchivedTrend archivedTrend = ArchivedTrend.builder()
                                            .userId(userId)
                                            .originalTrendId(trend.getId())
                                            .trendSnapshot(trend)
                                            .archivedAt(LocalDateTime.now())
                                            .build();
                                    log.info("[ARCHIVE] User {} archived trend {}", userId, trendId);
                                    return archivedTrendRepository.save(archivedTrend);
                                }))
                        ));
    }

    @DeleteMapping("/{trendId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> unarchiveTrend(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> {
                    log.info("[ARCHIVE] User {} unarchived trend {}", userId, trendId);
                    return archivedTrendRepository.deleteByUserIdAndOriginalTrendId(userId, trendId);
                });
    }
    
    @GetMapping("/{trendId}/status")
    public Mono<Boolean> getArchiveStatus(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> archivedTrendRepository.findByUserIdAndOriginalTrendId(userId, trendId)
                        .map(at -> true)
                        .defaultIfEmpty(false))
                .onErrorReturn(false);
    }
}
