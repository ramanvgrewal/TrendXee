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
    private static final Set<String> ACCESSORIES = Set.of("HEADWEAR", "BAG", "BELT", "JEWELRY", "EYEWEAR");
    private static final Set<String> NEUTRALS = Set.of("BLACK", "WHITE", "GREY", "GRAY", "NAVY", "BEIGE", "CREAM", "BROWN");
    private static final Map<String, Pattern> PATTERNS = new ConcurrentHashMap<>();
    private static final Map<String, String> LABELS = Map.of("TOP", "A top", "BOTTOM", "Jeans & bottoms",
            "LAYER", "A layer", "SHOES", "Shoes", "HEADWEAR", "Headwear", "BAG", "A bag", "BELT", "A belt",
            "JEWELRY", "Jewelry", "EYEWEAR", "Eyewear");

    private final TrendRepository repository;

    public record Item(Trend trend, String identity, String reason) {}
    public record Slot(String role, String label, List<Item> items) {}
    public record Pairings(String sourceIdentity, String audience, boolean needsAudience, List<Slot> slots) {}
    private record Profile(String role, boolean bulky, boolean closedLayer, Set<String> activities, Set<String> colors,
                           String pattern, String fit, Set<String> styles, Set<String> occasions) {}
    private record Candidate(Trend trend, String identity, Profile profile, double score, String reason) {}

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
            return repository.findPairingCandidates(LANES).filter(PairingService::eligible).collectList()
                    .map(trends -> recommend(source, identity, effective, audiences, profile, trends));
        });
    }

    private Pairings recommend(Trend source, String identity, String audience, Set<String> audiences,
                               Profile sourceProfile, List<Trend> trends) {
        List<Candidate> candidates = new ArrayList<>();
        for (Trend trend : trends) {
            ProductDetail target = product(trend);
            String targetIdentity = ProductIdentity.canonical(target.getShopUrl());
            if (identity.equals(targetIdentity) || Objects.equals(source.getId(), trend.getId())
                    || !audiences.contains(upper(target.getAudience()))) continue;
            Profile targetProfile = profile(target);
            if (targetProfile.role().equals("UNKNOWN") || targetProfile.role().equals(sourceProfile.role())
                    || !compatibleActivity(sourceProfile, targetProfile)) continue;
            if (sourceProfile.bulky() && targetProfile.role().equals("LAYER")) continue;
            candidates.add(rank(source, sourceProfile, trend, targetIdentity, targetProfile));
        }
        candidates.sort(Comparator.comparingDouble(Candidate::score).reversed()
                .thenComparing(Candidate::identity).thenComparing(c -> String.valueOf(c.trend().getId())));
        List<String> roles = new ArrayList<>(switch (sourceProfile.role()) {
            case "TOP" -> List.of("BOTTOM", "SHOES");
            case "BOTTOM" -> List.of("TOP", "SHOES");
            case "LAYER" -> sourceProfile.closedLayer() ? List.of("BOTTOM", "SHOES") : List.of("TOP", "BOTTOM", "SHOES");
            case "SHOES" -> List.of("TOP", "BOTTOM");
            default -> List.of("TOP", "BOTTOM", "SHOES");
        });
        // The final slot is optional. A garment and an accessory never compete inside one role.
        if (roles.size() < 3) {
            candidates.stream().filter(c -> ACCESSORIES.contains(c.profile().role())
                            || (!sourceProfile.bulky() && c.profile().role().equals("LAYER") && !c.profile().bulky()))
                    .map(c -> c.profile().role()).findFirst().ifPresent(roles::add);
        }
        List<Slot> slots = new ArrayList<>();
        Set<String> used = new HashSet<>(Set.of(identity));
        for (String role : roles) {
            List<Item> items = new ArrayList<>();
            for (Candidate candidate : candidates) {
                if (candidate.profile().role().equals(role) && used.add(candidate.identity())) {
                    items.add(new Item(cardPreview(candidate.trend()), candidate.identity(), candidate.reason()));
                    if (items.size() == 4) break;
                }
            }
            if (!items.isEmpty()) slots.add(new Slot(role, LABELS.get(role), List.copyOf(items)));
        }
        return new Pairings(identity, audience, false, List.copyOf(slots));
    }

    /** Cards need one photo; the full gallery/story is fetched only after identity revalidation. */
    private static Trend cardPreview(Trend trend) {
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
        Set<String> allowed = source.equals("UNISEX")
                ? new HashSet<>(requested.equals("ALL") ? Set.of("UNISEX") : Set.of(requested, "UNISEX"))
                : new HashSet<>(Set.of(source, "UNISEX"));
        if (!requested.equals("ALL")) allowed.retainAll(Set.of(requested, "UNISEX"));
        return allowed;
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

    private static Profile profile(ProductDetail p) {
        // Product type and title identify the garment itself. Descriptions often include
        // other styled pieces, and collection tags can name unrelated garment categories.
        String primary = text(p.getTitle()) + " " + text(p.getProductType());
        String role = role(primary);
        boolean bulky = role.equals("LAYER") && has(primary, "hoodies?|sweatshirts?|pullovers?|puffers?|padded|heavyweight");
        boolean closedLayer = role.equals("LAYER") && has(primary, "hoodies?|sweatshirts?|pullovers?");
        Set<String> activities = activities(primary);
        String attributes = primary + " " + text(p.getTags());
        Set<String> colors = new HashSet<>();
        // Named characters/graphics (Black Panther, Blue Lock) are not garment colors.
        // Only explicit color tags are used by the legacy fallback.
        for (String color : List.of("BLACK", "WHITE", "GREY", "GRAY", "NAVY", "BEIGE", "CREAM", "BROWN", "BLUE", "RED", "GREEN", "PINK"))
            if (p.getTags() != null && p.getTags().stream().anyMatch(tag ->
                    text(tag).matches("(?:colou?r\\s*[:_=-]?\\s*)?" + color.toLowerCase(Locale.ROOT)))) colors.add(color);
        String pattern = has(attributes, "graphic|printed|print|floral|camo|striped|checked") ? "PATTERNED"
                : has(attributes, "plain|solid|minimalist") ? "PLAIN" : "UNKNOWN";
        String fit = has(attributes, "oversized|baggy|wide[ -]leg|relaxed") ? "RELAXED"
                : has(attributes, "straight") ? "STRAIGHT" : has(attributes, "slim|skinny") ? "SLIM" : "UNKNOWN";
        Set<String> styles = new HashSet<>();
        for (String style : List.of("STREETWEAR", "VINTAGE", "MINIMAL", "ETHNIC"))
            if (has(attributes, style.toLowerCase(Locale.ROOT))) styles.add(style);
        Set<String> occasions = new HashSet<>();
        if (has(primary, "casual")) occasions.add("CASUAL");
        Map<String, Object> stored = p.getOutfitProfile();
        if (currentProfile(p, stored)) {
            String storedRole = upper(string(stored.get("role")));
            if (LABELS.containsKey(storedRole) && supported(p, stored, "role", storedRole)
                    && (role.equals("UNKNOWN") || role.equals(storedRole))) role = storedRole;
            if (role.equals("LAYER") && "BULKY".equals(stored.get("layering")) && supported(p, stored, "layering", "BULKY")) bulky = true;
            Set<String> verifiedColors = supportedValues(p, stored, "colors");
            if (!verifiedColors.isEmpty()) {
                colors.clear(); // Scoped variant/title evidence outranks broad collection color tags.
                colors.addAll(verifiedColors);
            }
            styles.addAll(supportedValues(p, stored, "styles"));
            occasions.addAll(supportedValues(p, stored, "occasions"));
            activities.addAll(supportedValues(p, stored, "activities"));
            String storedPattern = upper(string(stored.get("pattern")));
            if (supported(p, stored, "pattern", storedPattern)) {
                if (storedPattern.equals("PLAIN")) pattern = "PLAIN";
                else if (Set.of("GRAPHIC", "STRIPED", "CHECKED", "FLORAL", "CAMO").contains(storedPattern)) pattern = "PATTERNED";
            }
            String storedFit = upper(string(stored.get("fit")));
            if (supported(p, stored, "fit", storedFit)) {
                if (Set.of("OVERSIZED", "WIDE_LEG", "RELAXED").contains(storedFit)) fit = "RELAXED";
                else if (Set.of("STRAIGHT", "SLIM").contains(storedFit)) fit = storedFit;
            }
        }
        if (unsupportedOutfit(primary)) role = "UNKNOWN";
        // Activity words in a graphic tee or a sneaker's inspiration are not
        // evidence of performance equipment. Require a physical sports type.
        if (role.equals("TOP") && !has(primary, "jerseys?|compression|performance|training|workout|activewear")) activities.clear();
        if (role.equals("SHOES") && !has(primary, "sports shoes?|running shoes?|training shoes?|football (?:boots?|shoes?)|soccer cleats?|basketball shoes?|cricket shoes?|tennis shoes?|badminton shoes?|walking shoes?"))
            activities.clear();
        if (has(primary, "inspired|culture|graphic|artwork|print|slogan|lifestyle")) activities.clear();
        activities.retainAll(Set.of("FOOTBALL", "BASKETBALL", "CRICKET", "RUNNING", "TRAINING", "TENNIS", "BADMINTON", "WALKING", "ACTIVE"));
        return new Profile(role, bulky, closedLayer, activities, colors, pattern, fit, styles, occasions);
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
        if (has(primary, "jackets?|coats?|blazers?|cardigans?|hoodies?|sweatshirts?|pullovers?|overshirts?|shackets?|puffers?|windbreakers?")) roles.add("LAYER");
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

    private static Candidate rank(Trend source, Profile sourceProfile, Trend target, String identity, Profile targetProfile) {
        ProductDetail p = product(target);
        double score = 20;
        String reason = switch (targetProfile.role()) {
            case "TOP" -> "A top to wear with this piece.";
            case "BOTTOM" -> "A separate bottom to complete the outfit.";
            case "LAYER" -> "An outer layer for this outfit.";
            case "SHOES" -> "A casual footwear option for this outfit.";
            case "HEADWEAR" -> "Headwear to finish the outfit.";
            case "BAG" -> "A bag to carry with this outfit.";
            case "BELT" -> "A belt to complement the outfit.";
            case "JEWELRY" -> "Jewelry as a finishing detail.";
            default -> "Eyewear as a finishing detail.";
        };
        if (!sourceProfile.activities().isEmpty()) {
            score += 20;
            String activity = sourceProfile.activities().stream().filter(targetProfile.activities()::contains).sorted()
                    .findFirst().orElse("active").toLowerCase(Locale.ROOT);
            reason = "Both products carry " + activity + " details in their retailer metadata.";
        } else if (Set.of("TOP", "LAYER").contains(sourceProfile.role()) && sourceProfile.fit().equals("RELAXED") && targetProfile.role().equals("BOTTOM")
                && Set.of("RELAXED", "STRAIGHT").contains(targetProfile.fit())) {
            score += 12;
            reason = targetProfile.fit().equals("STRAIGHT") ? "A straight silhouette alongside the relaxed top."
                    : "A relaxed silhouette to continue the easy fit.";
        }
        if (sourceProfile.pattern().equals("PATTERNED") && targetProfile.pattern().equals("PLAIN")) {
            score += 15;
            reason = "A plain piece to balance the patterned starting piece.";
        }
        if (!targetProfile.colors().isEmpty() && NEUTRALS.containsAll(targetProfile.colors())) {
            score += 5;
            if (reason.startsWith("A separate") || reason.startsWith("A top") || reason.startsWith("A casual"))
                reason = "A neutral-colored " + (targetProfile.role().equals("SHOES") ? "shoe" : "piece") + " for easy styling.";
        }
        if (!sourceProfile.colors().isEmpty() && !Collections.disjoint(sourceProfile.colors(), targetProfile.colors())) score += 4;
        if (!Collections.disjoint(sourceProfile.styles(), targetProfile.styles())) score += 8;
        if (!Collections.disjoint(sourceProfile.occasions(), targetProfile.occasions())) score += 5;
        if (sourceProfile.pattern().equals("PATTERNED") && targetProfile.pattern().equals("PATTERNED")) score -= 5;
        if (!Objects.equals(upper(product(source).getBrandName()), upper(p.getBrandName()))) score += 2;
        double ratio = p.getPrice() / product(source).getPrice();
        if (ratio >= .4 && ratio <= 2.5) score += 1;
        if (Double.isFinite(target.getTrendScore())) score += Math.min(100, Math.max(0, target.getTrendScore())) / 100;
        return new Candidate(target, identity, targetProfile, score, reason);
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
