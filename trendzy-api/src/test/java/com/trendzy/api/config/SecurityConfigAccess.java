package com.trendzy.api.config;

import java.util.List;

/** Exposes the package-private origin list to tests in other packages. */
public final class SecurityConfigAccess {
    private SecurityConfigAccess() {}

    public static List<String> origins(String extra) {
        return SecurityConfig.allowedOriginPatterns(extra);
    }
}
