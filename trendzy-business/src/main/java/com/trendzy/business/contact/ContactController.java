package com.trendzy.business.contact;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping
    public ResponseEntity<?> sendContactEmail(@RequestBody Map<String, String> payload) {
        String userEmail = payload.get("email");
        String message = payload.get("message");

        if (userEmail == null || message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and message are required."));
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            // Important for GoDaddy/Microsoft 365: From must match the authenticated user
            mailMessage.setFrom("hello@trendxee.com");
            mailMessage.setTo("hello@trendxee.com");
            mailMessage.setSubject("New Contact Message from " + userEmail);
            mailMessage.setText("Message from: " + userEmail + "\n\n" + message);

            mailSender.send(mailMessage);
            return ResponseEntity.ok(Map.of("success", true, "message", "Email sent."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error sending email: " + e.getMessage()));
        }
    }
}
