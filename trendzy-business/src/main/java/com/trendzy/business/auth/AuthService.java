package com.trendzy.business.auth;

import com.trendzy.business.auth.dto.LoginRequest;
import com.trendzy.business.auth.dto.SignupRequest;
import com.trendzy.business.user.User;
import com.trendzy.business.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.cookie.name:trendxee_token}")
    private String cookieName;

    @Value("${app.cookie.domain:localhost}")
    private String cookieDomain;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("#{'${app.admin-emails:}'.split(',')}")
    private java.util.List<String> adminEmails;

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

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (isConfiguredAdmin(user.getEmail()) && !"ADMIN".equals(user.getRole())) {
            user.setRole("ADMIN");
            user = userRepository.save(user);
        }

        return user;
    }

    public User signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "Email is already registered");
        }

        String role = isConfiguredAdmin(request.getEmail()) ? "ADMIN" : "USER";
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        return userRepository.save(user);
    }

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
