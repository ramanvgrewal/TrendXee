package com.trendzy.business.auth;

import com.trendzy.business.auth.dto.AuthResponse;
import com.trendzy.business.auth.dto.LoginRequest;
import com.trendzy.business.auth.dto.SignupRequest;
import com.trendzy.business.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = authService.login(request);
        ResponseCookie cookie = authService.generateJwtCookie(user);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(user));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        User user = authService.signup(request);
        ResponseCookie cookie = authService.generateJwtCookie(user);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(user));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = authService.generateLogoutCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }
}
