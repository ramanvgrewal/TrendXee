package com.trendzy.business.contact;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final JavaMailSender mailSender;
    private final String from;
    private final String to;
    private final ContactRateLimit rateLimit = new ContactRateLimit();

    public ContactController(JavaMailSender mailSender,
                             @Value("${app.contact.from:${spring.mail.username:hello@trendxee.com}}") String from,
                             @Value("${app.contact.to:hello@trendxee.com}") String to) {
        this.mailSender = mailSender;
        this.from = from == null || from.isBlank() ? "hello@trendxee.com" : from;
        this.to = to == null || to.isBlank() ? "hello@trendxee.com" : to;
    }

    public record ContactRequest(String email, String message, String companyWebsite) {}

    @PostMapping
    public ResponseEntity<?> sendContactEmail(@RequestBody ContactRequest payload, HttpServletRequest request) {
        if (payload.companyWebsite() != null && !payload.companyWebsite().isBlank()) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        String email = payload.email() == null ? "" : payload.email().strip();
        String message = payload.message() == null ? "" : payload.message().strip();
        if (!validEmail(email) || message.length() < 10 || message.length() > 5000 || message.indexOf('\0') >= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provide a valid email and a message of 10–5,000 characters."));
        }
        if (!rateLimit.allow(request.getRemoteAddr())) {
            return ResponseEntity.status(429).header("Retry-After", "900")
                    .body(Map.of("error", "Too many messages. Please wait 15 minutes before trying again."));
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(from); mail.setTo(to); mail.setReplyTo(email);
            mail.setSubject("TrendXee contact message");
            mail.setText("Reply to: " + email + "\n\n" + message);
            mailSender.send(mail);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception error) {
            // Do not return mail credentials, server details or message content to visitors.
            log.warn("Contact delivery failed: {}", error.getClass().getSimpleName());
            return ResponseEntity.status(503).body(Map.of("error", "Your message was not sent. Please try again later."));
        }
    }

    private static boolean validEmail(String email) {
        if (email.isBlank() || email.length() > 254 || email.chars().anyMatch(Character::isISOControl)) return false;
        try {
            InternetAddress address = new InternetAddress(email, true);
            address.validate();
            return email.equals(address.getAddress()) && email.contains("@");
        } catch (AddressException error) { return false; }
    }
}
