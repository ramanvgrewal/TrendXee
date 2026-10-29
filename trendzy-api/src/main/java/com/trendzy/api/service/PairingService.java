package com.trendzy.api.service;

import com.trendzy.api.model.Trend;
import com.trendzy.api.model.Trend.ProductDetail;
import com.trendzy.api.model.ProductAudience;
import com.trendzy.api.repository.TrendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
public class PairingService {
    private static final List<String> LANES = List.of("TEES", "OUTERWEAR", "JEANS", "BOTTOMS", "ANIME",
            "SNEAKERS", "SPORTSWEAR", "POLOS", "CAPS", "ACCESSORIES");
    private static final Set<String> PUBLIC_STATUSES = Set.of("COMPLETED", "PARTIAL", "AWAITING_UNDERDOG",
            "PENDING", "IN_PROGRESS", "PROCESSING", "FAILED");
    private static final Map<String, Pattern> PATTERNS = new ConcurrentHashMap<>();
    private static final Set<String> ROLES = Set.of("TOP", "BOTTOM", "LAYER", "SHOES", "HEADWEAR", "BAG", "BELT", "JEWELRY", "EYEWEAR");

    private final TrendRepository repository;
    private VisualOutfitService visualOutfits;

    @org.springframework.beans.factory.annotation.Autowired
    public void setVisualOutfits(VisualOutfitService visualOutfits) { this.visualOutfits = visualOutfits; }

    public record Item(Trend trend, String identity, String reason) {}
    public record Slot(String role, String label, List<Item> items) {}
    public record Pairings(String sourceIdentity, String audience, boolean needsAudience, List<Slot> slots,
                           String engine, String outfitId, String modelVersion, String reason,
                           List<String> swappableRoles, String impressionId, String feedbackToken) {
        public Pairings(String sourceIdentity, String audience, boolean needsAudience, List<Slot> slots) {
            this(sourceIdentity, audience, needsAudience, slots, "curation-pending", null, null, null, List.of(), null, null);
        }
    }
    private record Profile(String role, boolean closedLayer, Set<String> activities) {}

    public Mono<Trend> selectedProduct(String id, String expectedIdentity) {
        return Mono.defer(() -> {
            String expected = expectedIdentity == null ? null : ProductIdentity.canonical(expectedIdentity);
            if (expected != null && expected.isEmpty()) return Mono.error(error(HttpStatus.BAD_REQUEST, "Invalid sourceIdentity"));
            return repository.findById(id)
                    .switchIfEmpty(Mono.error(error(HttpStatus.NOT_FOUND, "Product is no longer available on the board")))
                    .flatMap(trend -> {
                        if (!eligible(trend)) return Mono.error(error(HttpStatus.NOT_FOUND, "Product is no longer available on the board"));
                        if (expected != null && !expected.equals(ProductIdentity.canonical(product(trend).getShopUrl())))
                            return Mono.error(error(HttpStatus.CONFLICT, "This trend now shows a different product. Reload its story."));
                        return Mono.just(trend);
                    });
        });
    }

    public Mono<Pairings> pairings(String id, String requestedAudience, String expectedIdentity) {
        return pairings(id, requestedAudience, expectedIdentity, null, null, List.of(), null);
    }

    public Mono<Pairings> pairings(String id, String requestedAudience, String expectedIdentity,
                                   String lookId, String swapRole, List<String> excluded, String session) {
        String requested = upper(requestedAudience == null ? "ALL" : requestedAudience);
        if (!Set.of("ALL", "MEN", "WOMEN").contains(requested))
            return Mono.error(error(HttpStatus.BAD_REQUEST, "audience must be ALL, MEN or WOMEN"));
        return selectedProduct(id, expectedIdentity).flatMap(source -> {
            ProductDetail selected = product(source);
            String identity = ProductIdentity.canonical(selected.getShopUrl());
            Set<String> audiences = matchingAudiences(selected.getAudience(), requested);
            String effective = audiences.contains("MEN") ? "MEN" : audiences.contains("WOMEN") ? "WOMEN"
                    : audiences.isEmpty() ? "ALL" : "UNISEX";
            if (audiences.isEmpty()) return Mono.just(new Pairings(identity, effective, true, List.of()));
            Profile profile = profile(selected);
            if (profile.role().equals("UNKNOWN")) return Mono.just(new Pairings(identity, effective, false, List.of()));
            // A refresh invalidates its old image review. Never fill that gap with
            // independently ranked metadata picks or call an inference provider.
            Mono<Pairings> unavailable = lookId != null || swapRole != null
                    ? Mono.error(error(HttpStatus.CONFLICT, "This outfit changed. Reload its pairings."))
                    : Mono.just(new Pairings(identity, effective, false, List.of()));
            if (visualOutfits == null) return unavailable;
            return visualOutfits.recommend(source, effective, audiences, lookId, swapRole, excluded, session)
                    .switchIfEmpty(unavailable);
        });
    }

    /** Cards need one photo; the full gallery/story is fetched only after identity revalidation. */
    static Trend cardPreview(Trend trend) {
        ProductDetail p = product(trend);
        ProductDetail preview = ProductDetail.builder().brandName(p.getBrandName()).title(p.getTitle())
                .audience(p.getAudience()).currency(p.getCurrency()).price(p.getPrice()).originalPrice(p.getOriginalPrice())
                .shopUrl(p.getShopUrl()).imageUrl(p.getImageUrl()).build();
        return Trend.builder().id(trend.getId()).trendName(p.getTitle()).category(trend.getCategory())
                .subcategory(trend.getSubcategory()).enrichmentStatus(trend.getEnrichmentStatus()).active(true)
                .signalProducts(Trend.SignalProducts.builder().underdog(preview).build()).build();
    }

    private static Set<String> matchingAudiences(String sourceAudience, String requested) {
        String source = ProductAudience.normalize(sourceAudience);
        // A product correction must override a stale browsing preference. A
        // women's source always produces a women's look, including shared items.
        if (!source.equals("UNISEX")) return Set.of(source, "UNISEX");
        return requested.equals("ALL") ? Set.of("UNISEX") : Set.of(requested, "UNISEX");
    }

    static boolean eligible(Trend trend) {
        if (trend == null || !trend.isActive() || !LANES.contains(upper(trend.getCategory()))
                || !PUBLIC_STATUSES.contains(upper(trend.getEnrichmentStatus()))) return false;
        ProductDetail p = product(trend);
        if (p == null || blank(p.getTitle()) || !ProductIdentity.isProductUrl(p.getShopUrl())
                || ProductIdentity.canonical(p.getImageUrl()).isEmpty() || p.getPrice() == null
                || !Double.isFinite(p.getPrice()) || p.getPrice() <= 0) return false;
        if (Boolean.FALSE.equals(p.getAvailable()) || Boolean.FALSE.equals(p.getInStock())) return false;
        String availability = upper(p.getAvailability()).replaceAll("[^A-Z]", "");
        if (availability.endsWith("OUTOFSTOCK") || availability.endsWith("SOLDOUT") || availability.endsWith("PREORDER")
                || availability.endsWith("PRESALE") || availability.endsWith("BACKORDER") || availability.endsWith("DISCONTINUED") || availability.equals("UNAVAILABLE")) return false;
        String stockText = text(p.getTitle()) + " " + text(p.getTags());
        return !has(stockText, "sold[ -]?out|out[ -]?of[ -]?stock|pre[ -]?order|pre[ -]?sale|back[ -]?order|discontinued");
    }

    private static ProductDetail product(Trend trend) {
        return trend.getSignalProducts() == null ? null : trend.getSignalProducts().getUnderdog();
    }

    static String outfitRole(Trend trend) { return profile(product(trend)).role(); }
    static boolean outfitCompatible(Trend first, Trend second) {
        Profile a = profile(product(first)), b = profile(product(second));
        if (a.role().equals("UNKNOWN") || b.role().equals("UNKNOWN") || a.role().equals(b.role())) return false;
        if ((a.closedLayer() && b.role().equals("TOP")) || (b.closedLayer() && a.role().equals("TOP"))) return false;
        return compatibleActivity(a, b);
    }

    private static Profile profile(ProductDetail p) {
        // Product type and title identify the garment itself. Descriptions often include
        // other styled pieces, and collection tags can name unrelated garment categories.
        String primary = text(p.getTitle()) + " " + text(p.getProductType());
        String role = role(primary);
        boolean closedLayer = role.equals("LAYER") && has(primary, "hoodies?|sweatshirts?|pullovers?|sweaters?|knit(?:ted)?[ -]?vests?");
        Set<String> activities = activities(primary);
        Map<String, Object> stored = p.getOutfitProfile();
        if (currentProfile(p, stored)) {
            String storedRole = upper(string(stored.get("role")));
            if (ROLES.contains(storedRole) && supported(p, stored, "role", storedRole)
                    && (role.equals("UNKNOWN") || role.equals(storedRole))) role = storedRole;
            activities.addAll(supportedValues(p, stored, "activities"));
        }
        if (unsupportedOutfit(primary)) role = "UNKNOWN";
        // Activity words in a graphic tee or a sneaker's inspiration are not
        // evidence of performance equipment. Require a physical sports type.
        if (role.equals("TOP") && !has(primary, "jerseys?|compression|performance|training|workout|activewear")) activities.clear();
        if (role.equals("SHOES") && !has(primary, "sports shoes?|running shoes?|training shoes?|football (?:boots?|shoes?)|soccer cleats?|basketball shoes?|cricket shoes?|tennis shoes?|badminton shoes?|walking shoes?"))
            activities.clear();
        if (has(primary, "inspired|culture|graphic|artwork|print|slogan|lifestyle")) activities.clear();
        activities.retainAll(Set.of("FOOTBALL", "BASKETBALL", "CRICKET", "RUNNING", "TRAINING", "TENNIS", "BADMINTON", "WALKING", "ACTIVE"));
        return new Profile(role, closedLayer, activities);
    }

    private static boolean currentProfile(ProductDetail product, Map<String, Object> profile) {
        if (profile == null || !(profile.get("version") instanceof Number version) || version.intValue() != 1) return false;
        String storedIdentity = string(profile.get("sourceIdentity"));
        if (!storedIdentity.contains("://")) storedIdentity = "https://" + storedIdentity;
        return ProductIdentity.canonical(product.getShopUrl()).equals(ProductIdentity.canonical(storedIdentity))
                && clean(product.getTitle()).equals(clean(string(profile.get("sourceTitle"))));
    }

    private static Set<String> supportedValues(ProductDetail product, Map<String, Object> profile, String attribute) {
        Set<String> values = new HashSet<>();
        if (profile.get(attribute) instanceof Collection<?> entries)
            for (Object value : entries) if (supported(product, profile, attribute, upper(string(value)))) values.add(upper(string(value)));
        return values;
    }

    private static boolean supported(ProductDetail product, Map<String, Object> profile, String attribute, String value) {
        if (value.equals("UNKNOWN") || value.isBlank() || !(profile.get("evidence") instanceof Map<?, ?> evidence)
                || !(evidence.get(attribute) instanceof Collection<?> entries)) return false;
        return entries.stream().anyMatch(entry -> entry instanceof Map<?, ?> fact
                && value.equals(upper(string(fact.get("value"))))
                && fact.get("confidence") instanceof Number confidence && confidence.doubleValue() >= .75
                && evidenceStillPresent(product, fact));
    }

    /** Validate each claimed fact against today's product fields, including same-URL metadata edits. */
    private static boolean evidenceStillPresent(ProductDetail product, Map<?, ?> fact) {
        String excerpt = clean(string(fact.get("excerpt"))).replace('_', ' ');
        if (excerpt.isBlank()) return false;
        if ("description".equals(fact.get("source"))) {
            String raw = string(product.getDescription()).toLowerCase(Locale.ROOT);
            // Legacy scrapes sometimes flattened page scripts/styles into descriptions.
            // Never let those words (or cross-sells/model text) establish garment facts.
            if (raw.contains("<script") || raw.contains("<style") || raw.contains("/*") || raw.contains("@media")
                    || raw.contains("document.") || raw.contains("window.") || raw.contains("function(")
                    || (raw.contains("{") && raw.contains("}"))) return false;
            if (has(text(excerpt), "models?|modelled|modeled|pair(?: it)? with|style(?: it)? with|wear with|recommended|you may also|related products|our collection|shop all|navigation|size guide")) return false;
        }
        Object current = switch (string(fact.get("source"))) {
            case "title", "productName" -> product.getTitle();
            case "productType" -> product.getProductType();
            case "tags" -> product.getTags();
            case "description" -> product.getDescription();
            case "colors" -> product.getColor() != null ? product.getColor() : product.getColors();
            case "pattern" -> product.getPattern();
            case "fit" -> product.getFit();
            case "materials" -> product.getMaterial() != null ? product.getMaterial() : product.getMaterials();
            default -> null;
        };
        return !retailerText(current).isBlank() && retailerText(current).replace('_', ' ').contains(excerpt);
    }

    private static String retailerText(Object value) {
        if (value instanceof Collection<?> values) return values.stream().map(PairingService::retailerText)
                .filter(part -> !part.isBlank()).collect(java.util.stream.Collectors.joining(" | "));
        return value instanceof String string ? clean(string) : "";
    }

    private static boolean unsupportedOutfit(String primary) {
        return has(primary, "co[ -]?ord|two[ -]?piece|three[ -]?piece|outfit set|dress|jumpsuit|romper|saree|sari");
    }

    private static String role(String primary) {
        // Avoid assigning one arbitrary role to bundles or ambiguous garment names.
        if (unsupportedOutfit(primary)) return "UNKNOWN";
        Set<String> roles = new HashSet<>();
        if (has(primary, "jeans?|trousers?|pants|joggers?|sweatpants|shorts?|skirts?|leggings?")) roles.add("BOTTOM");
        if (has(primary, "sneakers?|sports shoes?|running shoes?|trainers?|training shoes?|football (?:boots?|shoes?)|soccer cleats?|basketball shoes?|cricket shoes?|tennis shoes?|badminton shoes?|walking shoes?|sandals?|slides?|clogs?|mules?|juttis?|mojaris?|ballerinas?|ballet flats?|ballets?|flats|loafers?")) roles.add("SHOES");
        if (has(primary, "jackets?|coats?|blazers?|cardigans?|hoodies?|sweatshirts?|pullovers?|overshirts?|shackets?|puffers?|windbreakers?|sweaters?|knit(?:ted)?[ -]?vests?")) roles.add("LAYER");
        if (has(primary, "t[ -]?shirts?|tees?|polos?|jerseys?|shirts?|tops?|blouses?|tank tops?")) roles.add("TOP");
        if (has(primary, "caps?|beanies?|hats?|headbands?")) roles.add("HEADWEAR");
        if (has(primary, "bags?|backpacks?|totes?|satchels?")) roles.add("BAG");
        if (has(primary, "belts?")) roles.add("BELT");
        if (has(primary, "necklaces?|earrings?|bracelets?|rings?|pendants?")) roles.add("JEWELRY");
        if (has(primary, "sunglasses|eyewear")) roles.add("EYEWEAR");
        // A denim jacket is not jeans; a shirt jacket is a layer.
        if (roles.equals(Set.of("TOP", "LAYER")) && has(primary, "shirt[ -]?jackets?")) return "LAYER";
        return roles.size() == 1 ? roles.iterator().next() : "UNKNOWN";
    }

    private static Set<String> activities(String primary) {
        Set<String> activities = new HashSet<>();
        if (has(primary, "football|soccer")) activities.add("FOOTBALL");
        if (has(primary, "basketball")) activities.add("BASKETBALL");
        if (has(primary, "cricket")) activities.add("CRICKET");
        if (has(primary, "running|jogging")) activities.add("RUNNING");
        if (has(primary, "gym|compression|training|workout")) activities.add("TRAINING");
        if (has(primary, "tennis")) activities.add("TENNIS");
        if (has(primary, "badminton")) activities.add("BADMINTON");
        if (has(primary, "walking")) activities.add("WALKING");
        if (activities.isEmpty() && has(primary, "sports?|athletic|performance|activewear")) activities.add("ACTIVE");
        return activities;
    }

    private static boolean compatibleActivity(Profile source, Profile target) {
        if (source.activities().isEmpty()) return target.activities().isEmpty();
        if (target.activities().isEmpty()) return false;
        Set<String> common = new HashSet<>(source.activities());
        common.retainAll(target.activities());
        // "Sports shoes" alone does not establish suitability for football/running/gym.
        if (common.isEmpty()) return false;
        return !(common.equals(Set.of("ACTIVE")) && (source.role().equals("SHOES") || target.role().equals("SHOES")));
    }

    private static String upper(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
    private static String string(Object value) { return value == null ? "" : value.toString(); }
    private static String clean(String value) { return HtmlUtils.htmlUnescape(string(value).replaceAll("<[^>]*>", " ")).replaceAll("\\s+", " ").trim(); }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String text(Object value) {
        return value == null ? "" : value.toString().replaceAll("<[^>]*>", " ").toLowerCase(Locale.ROOT).replace('_', ' ');
    }
    private static boolean has(String value, String expression) {
        return PATTERNS.computeIfAbsent(expression, key -> Pattern.compile("(?<![a-z])(?:" + key + ")(?![a-z])")).matcher(value).find();
    }
    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}
