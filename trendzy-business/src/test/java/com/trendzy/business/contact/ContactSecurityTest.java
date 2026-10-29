package com.trendzy.business.contact;

import com.trendzy.business.auth.JwtCookieAuthFilter;
import com.trendzy.business.auth.JwtTokenProvider;
import com.trendzy.business.auth.OAuth2LoginSuccessHandler;
import com.trendzy.business.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContactController.class)
@Import({SecurityConfig.class, JwtCookieAuthFilter.class})
class ContactSecurityTest {
    @Autowired private MockMvc mvc;
    @MockBean private JavaMailSender sender;
    @MockBean private JwtTokenProvider tokens;
    @MockBean private OAuth2LoginSuccessHandler loginSuccess;
    @MockBean private ClientRegistrationRepository registrations;

    @Test void contactPostIsPublicWithoutRelaxingOtherApiRoutes() throws Exception {
        mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"visitor@example.com\",\"message\":\"A question about the board.\"}"))
                .andExpect(status().isOk());
        verify(sender).send(any(SimpleMailMessage.class));
        mvc.perform(get("/api/contact")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/private-test")).andExpect(status().isUnauthorized());
    }
    @Test void productionOriginCanPreflightTheGuestForm() throws Exception {
        mvc.perform(options("/api/contact").header("Origin", "https://www.trendxee.com")
                .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "https://www.trendxee.com"));
        verifyNoInteractions(sender);
    }
    @Test void unrelatedOriginsAreNotGrantedAccess() throws Exception {
        mvc.perform(options("/api/contact").header("Origin", "https://unrelated.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(sender);
    }
}
