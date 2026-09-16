package com.trendzy.api.controller;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/trends")
@RequiredArgsConstructor
@Slf4j
public class TrendController {

    private final TrendRepository trendRepository;

    @GetMapping
    public Mono<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "streetwear") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        log.info("[CTRL] Fetching trends for category: {}, page: {}, size: {}",
                category, page, size);

        String normalized = category.trim().toUpperCase();
        Pageable pageable = PageRequest.of(page, size);
        List<String> categories = normalized.equals("CAPS")
                ? List.of("CAPS", "ACCESSORIES")
                : List.of(normalized);

        return trendRepository.findByCategory(categories, pageable)
                .collectList()
                .map(trends -> Map.of(
                        "content", trends,
                        "category", normalized,
                        "page", page,
                        "size", size
                ));
    }

    @DeleteMapping("/{id}")
    public Mono<Map<String, Object>> deleteTrendById(@PathVariable String id) {
        log.info("[CTRL] Permanently deleting trend with ID: {}", id);
        return trendRepository.deleteById(id)
                .then(Mono.just(Map.of(
                        "deletedId", id,
                        "message", "Successfully deleted trend permanently"
                )));
    }
}
