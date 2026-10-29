package com.trendzy.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OutfitFeedbackServiceTest {
    private final OutfitFeedbackService service=new OutfitFeedbackService(mock(ReactiveMongoTemplate.class),new ObjectMapper(),"a-long-test-only-signing-key-with-32-characters",true);
    @Test void signedExposureCannotBeForgedOrUsedToScoreAnUnseenProduct() {
        var look=new Document("id","look").append("members",List.of(new Document("trendId","source"),new Document("trendId","candidate")));
        String token=service.issue("impression","source",look,"model","UNISEX");
        assertEquals("look",service.verify(new OutfitFeedbackService.Event(token,"SAVE","candidate","anonymous-session-1234")).getString("outfitId"));
        assertThrows(ResponseStatusException.class,()->service.verify(new OutfitFeedbackService.Event(token+"tamper","SAVE","candidate","anonymous-session-1234")));
        assertThrows(ResponseStatusException.class,()->service.verify(new OutfitFeedbackService.Event(token,"SAVE","unseen","anonymous-session-1234")));
        assertThrows(ResponseStatusException.class,()->service.verify(new OutfitFeedbackService.Event(token,"PURCHASE","candidate","anonymous-session-1234")));
    }
}
