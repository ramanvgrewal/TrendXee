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

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        return user;
    }

    public User signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
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
                .sameSite("Lax")
                .domain(cookieDomain.equals("localhost") ? null : cookieDomain)
                .build();
    }
    
    public ResponseCookie generateLogoutCookie() {
        return ResponseCookie.from(cookieName, "")
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .maxAge(0)
                .sameSite("Lax")
                .domain(cookieDomain.equals("localhost") ? null : cookieDomain)
                .build();
    }
}
