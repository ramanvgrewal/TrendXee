package com.trendzy.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Signed server exposures bind learning events to an actually served outfit. No raw IP/user PII. */
@Service
public class OutfitFeedbackService {
    private final ReactiveMongoTemplate mongo;
    private final ObjectMapper json;
    private final byte[] secret;
    private final boolean enabled;
    private static final Set<String> TYPES = Set.of("IMPRESSION", "CLICK", "SHOP_CLICK", "SAVE", "SWAP");
    public record Event(String token, String type, String trendId, String sessionId) {}

    public OutfitFeedbackService(ReactiveMongoTemplate mongo, ObjectMapper json,
            @Value("${app.outfits.feedback-secret:}") String secret,
            @Value("${app.outfits.feedback-enabled:false}") boolean enabled) {
        this.mongo = mongo; this.json = json; this.enabled = enabled;
        if (enabled && secret.length() < 32) throw new IllegalStateException("OUTFIT_FEEDBACK_SECRET must have at least 32 characters");
        this.secret = (secret.length() >= 32 ? secret : UUID.randomUUID().toString()).getBytes(StandardCharsets.UTF_8);
    }

    public String issue(String impression, String source, Document look, String model, String audience) {
        if (!enabled) return null;
        try {
            Map<String, Object> claim = new LinkedHashMap<>();
            claim.put("impressionId", impression); claim.put("sourceId", source); claim.put("outfitId", look.getString("id"));
            claim.put("members", VisualOutfitService.members(look)); claim.put("modelVersion", model); claim.put("audience", audience);
            claim.put("expires", Instant.now().plus(2, ChronoUnit.HOURS).getEpochSecond());
            claim.put("policy", "vision-greedy-v2"); claim.put("propensity", 1.0);
            String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(json.writeValueAsBytes(claim));
            return payload+"."+Base64.getUrlEncoder().withoutPadding().encodeToString(sign(payload));
        } catch (Exception error) { throw new IllegalStateException("Could not issue outfit receipt", error); }
    }

    private byte[] sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    }

    @SuppressWarnings("unchecked")
    Document verify(Event event) {
        try {
            if (event == null || !TYPES.contains(event.type()) || event.token() == null || event.token().length() > 12000
                    || event.sessionId() == null || !event.sessionId().matches("[a-zA-Z0-9-]{16,64}")) throw new IllegalArgumentException();
            String[] parts = event.token().split("\\.");
            if (parts.length != 2 || !MessageDigest.isEqual(sign(parts[0]), Base64.getUrlDecoder().decode(parts[1]))) throw new IllegalArgumentException();
            Document claims = Document.parse(new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8));
            if (((Number)claims.get("expires")).longValue() < Instant.now().getEpochSecond()) throw new IllegalArgumentException();
            List<Document> members = claims.getList("members", Document.class);
            if (!"IMPRESSION".equals(event.type()) && (event.trendId() == null || event.trendId().equals(claims.getString("sourceId"))
                    || members.stream().noneMatch(m -> event.trendId().equals(m.getString("trendId"))))) throw new IllegalArgumentException();
            return claims;
        } catch (Exception error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid outfit event receipt"); }
    }

    public Mono<Void> record(Event event) {
        if (!enabled) return Mono.empty();
        Document claims = verify(event);
        // One event of each type/target per server exposure. Replays are idempotent.
        String key = claims.getString("impressionId")+":"+event.type()+":"+("IMPRESSION".equals(event.type()) ? "" : event.trendId());
        Instant now = Instant.now();
        Document row = new Document("_id", key).append("impressionId", claims.getString("impressionId"))
                .append("sourceId", claims.getString("sourceId")).append("outfitId", claims.getString("outfitId"))
                .append("members", claims.get("members")).append("audience", claims.getString("audience"))
                .append("modelVersion", claims.getString("modelVersion")).append("policy", claims.getString("policy"))
                .append("propensity", claims.get("propensity")).append("type", event.type()).append("targetId", event.trendId())
                .append("sessionHash", HexFormat.of().formatHex(hash(event.sessionId())))
                .append("createdAt", Date.from(now)).append("expiresAt", Date.from(now.plus(90, ChronoUnit.DAYS)));
        return mongo.insert(row, "outfit_events").then()
                .onErrorResume(org.springframework.dao.DuplicateKeyException.class, ignored -> Mono.empty());
    }

    private byte[] hash(String value) {
        try { return sign("session:"+value); } catch (Exception error) { throw new IllegalStateException(error); }
    }
}
