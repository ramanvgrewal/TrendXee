package com.trendzy.business.contact;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContactControllerTest {
    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final ObjectMapper json = new ObjectMapper();
    private MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ContactController(sender, "hello@trendxee.com", "hello@trendxee.com")).build();
    }
    @Test void anonymousVisitorsCanSendToTheConfiguredMailboxWithTheirEmailAsReplyTo() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", " visitor@example.com ", "message", "Please consider this label.\nThank you."))))
                .andExpect(status().isOk());
        var mail = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(mail.capture());
        assertArrayEquals(new String[]{"hello@trendxee.com"}, mail.getValue().getTo());
        assertEquals("hello@trendxee.com", mail.getValue().getFrom());
        assertEquals("visitor@example.com", mail.getValue().getReplyTo());
        assertTrue(mail.getValue().getText().contains("Please consider this label.\nThank you."));
    }
    @ParameterizedTest
    @ValueSource(strings = {"", "not-an-email", "a@example.com,b@example.com", "a@example.com\r\nBcc: b@example.com", "Someone <a@example.com>"})
    void invalidOrInjectedEmailsNeverReachTheMailSender(String email) throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "message", "A real message with enough detail."))))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(sender);
    }
    @Test void missingShortAndOversizedMessagesAreRejected() throws Exception {
        for (String message : new String[]{"", "short", "a".repeat(5001)}) {
            mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("email", "visitor@example.com", "message", message))))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(sender);
    }
    @Test void filledHoneypotDoesNotSendMail() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "bot@example.com", "message", "Unwanted automated message.", "companyWebsite", "filled"))))
                .andExpect(status().isOk());
        verifyNoInteractions(sender);
    }
    @Test void repeatedMessagesAreRateLimitedBeforeSendingMoreMail() throws Exception {
        String payload = json.writeValueAsString(Map.of("email", "visitor@example.com", "message", "A detailed question about the board."));
        for (int i = 0; i < 5; i++) mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isOk());
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isTooManyRequests());
        verify(sender, times(5)).send(any(SimpleMailMessage.class));
    }
    @Test void deliveryFailureIsReportedWithoutExposingSmtpDetails() throws Exception {
        doThrow(new MailAuthenticationException("private SMTP diagnostic")).when(sender).send(any(SimpleMailMessage.class));
        var response = mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "visitor@example.com", "message", "A real question about the board."))))
                .andExpect(status().isServiceUnavailable()).andReturn().getResponse();
        assertFalse(response.getContentAsString().contains("private SMTP"));
        assertTrue(response.getContentAsString().contains("not sent"));
    }
}
