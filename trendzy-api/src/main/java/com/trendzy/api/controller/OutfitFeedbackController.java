package com.trendzy.api.controller;

import com.trendzy.api.service.OutfitFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v2/outfits")
@RequiredArgsConstructor
public class OutfitFeedbackController {
    private final OutfitFeedbackService feedback;
    @PostMapping("/events")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> event(@RequestBody OutfitFeedbackService.Event event) { return feedback.record(event); }
}
