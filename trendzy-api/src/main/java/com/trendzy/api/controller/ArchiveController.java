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

    private String getProductIdentifier(com.trendzy.api.model.Trend trend) {
        if (trend == null || trend.getSignalProducts() == null) return "";
        if (trend.getSignalProducts().getUnderdog() != null && trend.getSignalProducts().getUnderdog().getTitle() != null) {
            return trend.getSignalProducts().getUnderdog().getTitle();
        }
        if (trend.getSignalProducts().getAmazon() != null && trend.getSignalProducts().getAmazon().getTitle() != null) {
            return trend.getSignalProducts().getAmazon().getTitle();
        }
        if (trend.getSignalProducts().getFlipkart() != null && trend.getSignalProducts().getFlipkart().getTitle() != null) {
            return trend.getSignalProducts().getFlipkart().getTitle();
        }
        return trend.getTrendName();
    }

    @GetMapping
    public Flux<ArchivedTrend> getArchivedTrends() {
        return getAuthenticatedUserId()
                .flatMapMany(userId -> archivedTrendRepository.findByUserIdOrderByArchivedAtDesc(userId));
    }

    @PostMapping("/{trendId}")
    public Mono<ArchivedTrend> archiveTrend(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> trendRepository.findById(trendId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Trend not found")))
                        .flatMap(currentTrend -> {
                            String currentIdStr = getProductIdentifier(currentTrend);
                            return archivedTrendRepository.findByUserIdAndOriginalTrendId(userId, trendId)
                                    .filter(at -> getProductIdentifier(at.getTrendSnapshot()).equals(currentIdStr))
                                    .next()
                                    .switchIfEmpty(Mono.defer(() -> {
                                        ArchivedTrend archivedTrend = ArchivedTrend.builder()
                                                .userId(userId)
                                                .originalTrendId(trendId)
                                                .trendSnapshot(currentTrend)
                                                .archivedAt(LocalDateTime.now())
                                                .build();
                                        log.info("[ARCHIVE] User {} archived trend {} with product '{}'", userId, trendId, currentIdStr);
                                        return archivedTrendRepository.save(archivedTrend);
                                    }));
                        }));
    }

    @DeleteMapping("/{trendId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> unarchiveTrend(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> trendRepository.findById(trendId)
                        .flatMap(currentTrend -> {
                            String currentIdStr = getProductIdentifier(currentTrend);
                            return archivedTrendRepository.findByUserIdAndOriginalTrendId(userId, trendId)
                                    .filter(at -> getProductIdentifier(at.getTrendSnapshot()).equals(currentIdStr))
                                    .flatMap(at -> {
                                        log.info("[ARCHIVE] User {} unarchived trend {} with product '{}'", userId, trendId, currentIdStr);
                                        return archivedTrendRepository.delete(at);
                                    })
                                    .then();
                        })
                );
    }
    
    @GetMapping("/{trendId}/status")
    public Mono<Boolean> getArchiveStatus(@PathVariable String trendId) {
        return getAuthenticatedUserId()
                .flatMap(userId -> trendRepository.findById(trendId)
                        .flatMap(currentTrend -> {
                            String currentIdStr = getProductIdentifier(currentTrend);
                            return archivedTrendRepository.findByUserIdAndOriginalTrendId(userId, trendId)
                                    .filter(at -> getProductIdentifier(at.getTrendSnapshot()).equals(currentIdStr))
                                    .hasElements();
                        })
                        .defaultIfEmpty(false)
                )
                .onErrorReturn(false);
    }
}
