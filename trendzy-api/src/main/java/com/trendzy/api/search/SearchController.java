package com.trendzy.api.search;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Tag(name = "Search", description = "Brand, style and product search")
@RestController
@RequestMapping("/api/v2/search")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService searchService;

    @Operation(summary = "Search the visible catalog", description = "Matches brands, styles and products. A style with a null label is a whole lane.")
    @GetMapping
    public Mono<SearchResult> search(@RequestParam String q,
                                     @RequestParam(defaultValue = "ALL") String audience,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "24") int size) {
        String query = q.trim();
        String normalizedAudience = audience.trim().toUpperCase(Locale.ROOT);
        if (query.length() < 2 || query.length() > 80) throw badRequest("q must be 2..80 characters");
        if (!List.of("ALL", "MEN", "WOMEN", "UNISEX").contains(normalizedAudience)) {
            throw badRequest("audience must be ALL, MEN, WOMEN or UNISEX");
        }
        if (page < 0 || size < 1 || size > 50) throw badRequest("page must be non-negative and size must be 1..50");
        return Mono.fromSupplier(() -> searchService.search(query, normalizedAudience, page, size));
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
