package com.trendzy.business.analytics;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClickRequest {
    @NotBlank(message = "trendId is required")
    @Size(max = 100, message = "trendId must not exceed 100 characters")
    private String trendId;

    @NotBlank(message = "source is required")
    @Size(max = 50, message = "source must not exceed 50 characters")
    private String source;

    @NotBlank(message = "url is required")
    @Size(max = 2048, message = "url must not exceed 2048 characters")
    private String url;
}
