package com.trendzy.business.auth;

import com.trendzy.business.user.User;
import com.trendzy.business.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("#{'${app.admin-emails:}'.split(',')}")
    private List<String> adminEmails;

    @Value("${app.cookie.name:trendxee_token}")
    private String cookieName;

    @Value("${app.cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    private boolean isConfiguredAdmin(String email) {
        if (email == null) return false;
        String cleanEmail = email.trim().toLowerCase();
        if (adminEmails != null && adminEmails.stream()
                .filter(java.util.Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(a -> !a.isEmpty())
                .anyMatch(a -> a.equals(cleanEmail))) {
            return true;
        }
        return "ramanvgrewal@gmail.com".equalsIgnoreCase(cleanEmail);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getName();

        boolean isAdmin = isConfiguredAdmin(email);

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String role = isAdmin ? "ADMIN" : "USER";
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .providerId(providerId)
                    .role(role)
                    .build();
            return userRepository.save(newUser);
        });

        // Force upgrade if they were created as USER previously and are configured as ADMIN
        if (isAdmin && !"ADMIN".equals(user.getRole())) {
            user.setRole("ADMIN");
            user = userRepository.save(user);
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(86400) // 24 hours
                .sameSite(cookieSecure ? "None" : "Lax")
                .domain(cookieDomain.equals("localhost") ? null : cookieDomain)
                .build();
        
        response.addHeader("Set-Cookie", cookie.toString());

        getRedirectStrategy().sendRedirect(request, response, frontendUrl);
    }
}
