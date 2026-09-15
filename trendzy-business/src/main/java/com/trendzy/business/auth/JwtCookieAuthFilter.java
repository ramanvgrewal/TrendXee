package com.trendzy.business.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtCookieAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Value("${app.cookie.name:trendxee_token}")
    private String cookieName;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String jwt = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }

        // fallback to auth header just in case some local client needs it
        if (jwt == null) {
            String bearerToken = request.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                jwt = bearerToken.substring(7);
            }
        }

        if (jwt != null && tokenProvider.validateToken(jwt)) {
            String userId = tokenProvider.getUserIdFromToken(jwt);
            String role = tokenProvider.getRoleFromToken(jwt);

            // In Business API, we store userId in the principal for easy access, or email. Let's use userId.
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
            
            // To make sure SecurityContextHolder has it
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
