package com.trendzy.business.analytics;

import lombok.Data;

@Data
public class ClickRequest {
    private String trendId;
    private String source;
    private String url;
}
