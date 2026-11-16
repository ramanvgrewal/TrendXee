package com.trendzy.api.controller;

import com.trendzy.api.model.FeaturedPick;
import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.FeaturedPickRepository;
import com.trendzy.api.repository.TrendRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Featured", description = "Admin-chosen product of the day (India time)")
@RestController
@RequestMapping("/api/v2/featured")
@RequiredArgsConstructor
@Slf4j
public class FeaturedController {

    static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");
    static final int MAX_DAYS_AHEAD = 60;

    private final FeaturedPickRepository featuredPickRepository;
    private final TrendRepository trendRepository;
    private Clock clock = Clock.system(INDIA);

    void setClock(Clock clock) { this.clock = clock; }

    LocalDate indiaToday() { return LocalDate.now(clock.withZone(INDIA)); }

    static boolean showable(Trend trend) {
        if (trend == null || !trend.isActive() || trend.getSignalProducts() == null) return false;
        Trend.ProductDetail product = trend.getSignalProducts().getUnderdog();
        return product != null && product.getShopUrl() != null && !product.getShopUrl().isBlank()
                && product.getImageUrl() != null && !product.getImageUrl().isBlank();
    }

    @Operation(summary = "Today's featured product", description = "Returns 204 when no valid pick is set for today in India.")
    @GetMapping("/today")
    public Mono<ResponseEntity<Map<String, Object>>> today() {
        String date = indiaToday().toString();
        return featuredPickRepository.findById(date)
                .flatMap(pick -> trendRepository.findById(pick.getTrendId()))
                .filter(FeaturedController::showable)
                .map(trend -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("date", date);
                    body.put("trend", trend);
                    return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5))).body(body);
                })
                .defaultIfEmpty(ResponseEntity.noContent().cacheControl(CacheControl.maxAge(Duration.ofMinutes(5))).build());
    }

    @Operation(summary = "Upcoming featured picks (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public Flux<FeaturedPick> upcoming() {
        return featuredPickRepository.findByDateGreaterThanEqualOrderByDateAsc(indiaToday().toString());
    }

    @Operation(summary = "Feature a product on a date (Admin only)", description = "Date is yyyy-MM-dd in India time, today up to 60 days ahead. Replaces any existing pick for that date.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{date}")
    public Mono<FeaturedPick> feature(@PathVariable String date, @RequestBody Map<String, String> body) {
        LocalDate day = parseDate(date);
        String trendId = body == null ? null : body.get("trendId");
        if (trendId == null || trendId.isBlank()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "trendId is required"));
        }
        String note = body.get("note");
        if (note != null && note.length() > 200) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "note must be at most 200 characters"));
        }
        return trendRepository.findById(trendId.trim())
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found")))
                .filter(FeaturedController::showable)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Product is inactive or has no store link or image")))
                .flatMap(trend -> adminId().flatMap(admin -> featuredPickRepository.save(FeaturedPick.builder()
                        .date(day.toString())
                        .trendId(trend.getId())
                        .note(note == null || note.isBlank() ? null : note.strip())
                        .createdBy(admin)
                        .updatedAt(Instant.now())
                        .build())))
                .doOnNext(pick -> log.info("[ADMIN] Featured trend {} on {}", pick.getTrendId(), pick.getDate()));
    }

    @Operation(summary = "Remove a featured pick (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> remove(@PathVariable String date) {
        return featuredPickRepository.deleteById(parseDate(date).toString());
    }

    private LocalDate parseDate(String date) {
        LocalDate day;
        try {
            day = LocalDate.parse(date);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date must be yyyy-MM-dd");
        }
        LocalDate now = indiaToday();
        if (day.isBefore(now) || day.isAfter(now.plusDays(MAX_DAYS_AHEAD))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date must be today or up to " + MAX_DAYS_AHEAD + " days ahead (India time)");
        }
        return day;
    }

    private Mono<String> adminId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> String.valueOf(context.getAuthentication().getPrincipal()))
                .defaultIfEmpty("admin");
    }
}
