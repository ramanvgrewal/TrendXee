package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.service.PairingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/** All reads are live: a refreshed trend ID must not reuse an earlier product's pairing. */
@RestController
@RequestMapping("/api/v2/trends")
@RequiredArgsConstructor
public class PairingController {
    private final PairingService pairingService;

    @GetMapping("/{id}/pairings")
    public Mono<ResponseEntity<PairingService.Pairings>> pairings(
            @PathVariable String id,
            @RequestParam(defaultValue = "ALL") String audience,
            @RequestParam(required = false) String sourceIdentity,
            @RequestParam(required = false) String lookId,
            @RequestParam(required = false) String swapRole,
            @RequestParam(required = false) java.util.List<String> exclude,
            ServerHttpResponse response) {
        response.getHeaders().setCacheControl(CacheControl.noStore());
        return (lookId == null && swapRole == null
                ? pairingService.pairings(id, audience, sourceIdentity)
                : pairingService.pairings(id, audience, sourceIdentity, lookId, swapRole,
                    exclude == null ? java.util.List.of() : exclude, null))
                .map(result -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(result));
    }

    /** Revalidate a suggestion immediately before opening its normal product story. */
    @GetMapping("/{id}")
    public Mono<ResponseEntity<Trend>> selectedProduct(
            @PathVariable String id,
            @RequestParam(required = false) String sourceIdentity,
            ServerHttpResponse response) {
        response.getHeaders().setCacheControl(CacheControl.noStore());
        return pairingService.selectedProduct(id, sourceIdentity)
                .map(result -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(result));
    }
}
