package com.trendzy.business.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ProductClickRepository productClickRepository;

    @PostMapping("/click")
    public ResponseEntity<Void> trackClick(@RequestBody ClickRequest request) {
        String userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            userId = (String) authentication.getPrincipal();
        }

        ProductClick click = ProductClick.builder()
                .userId(userId)
                .trendId(request.getTrendId())
                .source(request.getSource())
                .url(request.getUrl())
                .build();
                
        productClickRepository.save(click);
        return ResponseEntity.ok().build();
    }
}
