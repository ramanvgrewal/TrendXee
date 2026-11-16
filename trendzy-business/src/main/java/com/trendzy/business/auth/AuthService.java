package com.trendzy.business.auth;

import com.trendzy.business.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider tokenProvider;

    @Value("${app.cookie.name:trendxee_token}")
    private String cookieName;

    @Value("${app.cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    public ResponseCookie generateJwtCookie(User user) {
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        return ResponseCookie.from(cookieName, token)
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(86400) // 24 hours
                .sameSite(cookieSecure ? "None" : "Lax")
                .domain(cookieDomain.equals("localhost") ? null : cookieDomain)
                .build();
    }
    
    public ResponseCookie generateLogoutCookie() {
        return ResponseCookie.from(cookieName, "")
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(0)
                .sameSite(cookieSecure ? "None" : "Lax")
                .domain(cookieDomain.equals("localhost") ? null : cookieDomain)
                .build();
    }
}
