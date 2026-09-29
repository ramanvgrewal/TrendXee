package com.trendzy.business.contact;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final JavaMailSender mailSender;

    // Simple in-memory rate limiter: max 3 submissions per IP per hour
    private final ConcurrentHashMap<String, AtomicInteger> ipRequestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_HOUR = 3;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    @PostMapping
    public ResponseEntity<?> sendContactEmail(
            @RequestBody Map<String, String> payload,
            jakarta.servlet.http.HttpServletRequest request) {

        String userEmail = payload.get("email");
        String message = payload.get("message");

        // Input validation
        if (userEmail == null || userEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        if (!EMAIL_PATTERN.matcher(userEmail.trim()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email format."));
        }
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required."));
        }
        if (message.trim().length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message too long (max 2000 characters)."));
        }

        // Rate limiting by IP
        String clientIp = getClientIp(request);
        AtomicInteger count = ipRequestCounts.computeIfAbsent(clientIp, k -> new AtomicInteger(0));
        if (count.incrementAndGet() > MAX_REQUESTS_PER_HOUR) {
            log.warn("[CONTACT] Rate limit exceeded for IP: {}", clientIp);
            return ResponseEntity.status(429).body(Map.of("error", "Too many requests. Please try again later."));
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom("hello@trendxee.com");
            mailMessage.setTo("hello@trendxee.com");
            mailMessage.setReplyTo(userEmail.trim());
            mailMessage.setSubject("New Contact Message from " + userEmail.trim());
            mailMessage.setText("Message from: " + userEmail.trim() + "\n\n" + message.trim());

            mailSender.send(mailMessage);
            log.info("[CONTACT] Email sent successfully from: {}", userEmail.trim());
            return ResponseEntity.ok(Map.of("success", true, "message", "Email sent."));
        } catch (Exception e) {
            log.error("[CONTACT] Failed to send email from: {}", userEmail.trim(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send message. Please try again."));
        }
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
