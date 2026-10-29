package com.trendzy.api.service;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/** No image downloads or model calls on the serving path. Every member is revalidated live. */
@Service
public class VisualOutfitService {
    private final TrendRepository trends;
    private final ReactiveMongoTemplate mongo;
    private final OutfitFeedbackService feedback;
    private final boolean enabled;
    private final Map<String, Mono<Document>> cache = new ConcurrentHashMap<>();
    private static final Map<String, String> LABELS = Map.of("TOP", "Top", "BOTTOM", "Jeans & bottoms", "SHOES", "Shoes",
            "LAYER", "Layer", "HEADWEAR", "Headwear", "BAG", "Bag", "BELT", "Belt", "JEWELRY", "Jewelry", "EYEWEAR", "Eyewear");

    public VisualOutfitService(TrendRepository trends, ReactiveMongoTemplate mongo, OutfitFeedbackService feedback,
                              @Value("${app.outfits.enabled:true}") boolean enabled) {
        this.trends = trends; this.mongo = mongo; this.feedback = feedback; this.enabled = enabled;
    }

    public Mono<PairingService.Pairings> recommend(Trend source, String audience, Set<String> audiences,
            String lookId, String swapRole, List<String> excluded, String session) {
        if (!enabled) return Mono.empty();
        if ((lookId == null) != (swapRole == null) || excluded == null || excluded.size() > 40
                || (swapRole != null && !LABELS.containsKey(swapRole)))
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid outfit swap"));
        String fingerprint = OutfitFingerprint.of(source.getSignalProducts().getUnderdog());
        String key = source.getId()+":"+audience+":"+fingerprint;
        if (cache.size() > 512) cache.clear();
        Mono<Document> pack = cache.computeIfAbsent(key, ignored -> mongo.findOne(Query.query(Criteria.where("sourceId").is(source.getId())
                        .and("audience").is(audience).and("sourceFingerprint").is(fingerprint)), Document.class, "outfit_recommendations")
                .cache(Duration.ofSeconds(30)));
        return pack.flatMap(document -> {
            Date expires = document.getDate("expiresAt");
            if (!Objects.equals(document.getInteger("schemaVersion"), 2) || document.getString("initialLookId") == null
                    || expires == null || expires.before(new Date())) return Mono.empty();
            List<Document> looks = document.getList("looks", Document.class, List.of());
            if (looks.size() > 200) return Mono.empty();
            Set<String> ids = looks.stream().flatMap(look -> members(look).stream()).map(m -> m.getString("trendId")).collect(Collectors.toSet());
            if (ids.size() > 200 || ids.contains(null)) return Mono.empty();
            // Pack caching never caches products: a replacement, same-URL content edit,
            // gender correction, delisting or sold-out change takes effect immediately.
            return trends.findCurrentOutfitMembers(new ArrayList<>(ids)).collectMap(Trend::getId).flatMap(current -> {
                current.put(source.getId(), source);
                List<Document> allValid = looks.stream().filter(look -> valid(look, source, audiences, current)).toList();
                double qualityFloor = allValid.stream().mapToDouble(VisualOutfitService::score).max().orElse(7)-1;
                // Repeated swaps cannot gradually walk down to much weaker looks.
                List<Document> valid = allValid.stream().filter(look -> score(look) >= qualityFloor).toList();
                Document chosen;
                if (lookId != null) {
                    Document previous = valid.stream().filter(l -> lookId.equals(l.getString("id"))).findFirst().orElse(null);
                    if (previous == null) return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "This outfit is no longer current"));
                    chosen = swaps(previous, swapRole, valid, source.getId(), excluded).stream().findFirst().orElse(null);
                    if (chosen == null) return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "No more compatible swaps for this look"));
                } else {
                    chosen = valid.stream().filter(l -> document.getString("initialLookId").equals(l.getString("id"))).findFirst().orElse(null);
                    if (chosen == null) chosen = valid.stream().max(Comparator.comparingDouble(VisualOutfitService::score)).orElse(null);
                }
                if (chosen == null) return Mono.empty();
                return Mono.just(response(document, chosen, valid, current, source, audience));
            });
        }).onErrorResume(org.springframework.dao.DataAccessException.class, error -> Mono.empty())
                .onErrorResume(ClassCastException.class, error -> Mono.empty());
    }

    private PairingService.Pairings response(Document pack, Document look, List<Document> valid, Map<String, Trend> current,
                                             Trend source, String audience) {
        List<PairingService.Slot> slots = new ArrayList<>();
        List<String> swappable = new ArrayList<>();
        String reason = look.getString("reason");
        for (Document member : members(look)) {
            if (source.getId().equals(member.getString("trendId"))) continue;
            String role = member.getString("role");
            Trend trend = current.get(member.getString("trendId"));
            slots.add(new PairingService.Slot(role, LABELS.get(role), List.of(new PairingService.Item(
                    PairingService.cardPreview(trend), member.getString("identity"), "Chosen with the other pieces in this look."))));
            if (!swaps(look, role, valid, source.getId(), List.of()).isEmpty()) swappable.add(role);
        }
        String impression = UUID.randomUUID().toString();
        String token = feedback.issue(impression, source.getId(), look, pack.getString("modelVersion"), audience);
        return new PairingService.Pairings(ProductIdentity.canonical(source.getSignalProducts().getUnderdog().getShopUrl()), audience,
                false, List.copyOf(slots), "vision-v2", look.getString("id"), pack.getString("modelVersion"), reason,
                List.copyOf(swappable), impression, token);
    }

    static List<Document> members(Document look) { return look.getList("members", Document.class, List.of()); }
    static double score(Document look) { return look.get("score") instanceof Number n ? n.doubleValue() : -1; }

    static boolean valid(Document look, Trend source, Set<String> audiences, Map<String, Trend> current) {
        List<Document> members = members(look);
        if (members.size() < 3 || members.size() > 4 || score(look) < 6 || !Double.isFinite(score(look)) || score(look) > 10
                || look.getString("reason") == null || look.getString("reason").length() > 600
                || look.getString("id") == null || !(look.get("review") instanceof Document review)
                || !"complete-outfit-images".equals(review.getString("method")) || !Boolean.FALSE.equals(review.getBoolean("uncertain"))) return false;
        Set<String> identities = new HashSet<>(), roles = new HashSet<>();
        boolean hasSource = false;
        List<Trend> items = new ArrayList<>();
        for (Document member : members) {
            Trend trend = current.get(member.getString("trendId"));
            if (!PairingService.eligible(trend)) return false;
            var product = trend.getSignalProducts().getUnderdog();
            if (product.getCurrency() != null && !product.getCurrency().equalsIgnoreCase("INR")) return false;
            String identity = ProductIdentity.canonical(product.getShopUrl());
            if (!identity.equals(member.getString("identity")) || !OutfitFingerprint.of(product).equals(member.getString("fingerprint"))
                    || !audiences.contains(product.getAudience()) || !LABELS.containsKey(member.getString("role"))
                    || !PairingService.outfitRole(trend).equals(member.getString("role")) || !identities.add(identity) || !roles.add(member.getString("role"))) return false;
            if (source.getId().equals(trend.getId())) hasSource = true;
            items.add(trend);
        }
        if (!hasSource || !roles.contains("BOTTOM") || !roles.contains("SHOES") || !(roles.contains("TOP") || roles.contains("LAYER"))) return false;
        for (int i=0; i<items.size(); i++) for (int j=i+1; j<items.size(); j++)
            if (!PairingService.outfitCompatible(items.get(i), items.get(j))) return false;
        return true;
    }

    static List<Document> swaps(Document previous, String role, List<Document> looks, String sourceId, List<String> excluded) {
        Map<String, String> fixed = new HashMap<>();
        String old = null;
        for (Document m : members(previous)) {
            if (role.equals(m.getString("role")) && !sourceId.equals(m.getString("trendId"))) old = m.getString("identity");
            else fixed.put(m.getString("role"), m.getString("identity"));
        }
        if (old == null) return List.of();
        final String oldIdentity = old;
        return looks.stream().filter(look -> members(look).size() == members(previous).size() && score(look) >= score(previous)-1)
                .filter(look -> {
                    boolean changed = false;
                    for (Document m : members(look)) {
                        String r = m.getString("role"), identity = m.getString("identity");
                        if (r.equals(role)) {
                            if (identity.equals(oldIdentity) || excluded.contains(identity)) return false;
                            changed = true;
                        } else if (!identity.equals(fixed.get(r))) return false;
                    }
                    return changed;
                }).sorted(Comparator.comparingDouble(VisualOutfitService::score).reversed().thenComparing(l -> l.getString("id"))).toList();
    }
}
