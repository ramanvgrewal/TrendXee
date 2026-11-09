package com.trendzy.api.service;

import org.bson.Document;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.regex.Pattern;

/** Small, ordered style families. Raw scraper labels remain intact for product provenance. */
public final class CatalogStyles {
    private CatalogStyles() {}
    private static final String OTHER_ACCESSORIES =
            "\\b(bags?|totes?|wallets?|belts?|sunglasses|earrings?|earcuffs?|key[ -]?rings?|watch straps?)\\b";
    private static final String SHIRT = "\\bshirts?\\b";
    private static final String NON_SHIRT = "\\b(?:t[ -]?shirts?|tees?|polos?|overshirts?|shackets?|sweatshirts?|"
            + "shirts?[ -]dresses?|suits?|kurtas?|kurtis?|co[ -]?ords?|sets?|blazers?)\\b";
    private static final String OTHER_GARMENT =
            "\\b(?:vests?|blouses?|tunics?|jumpsuits?|jackets?|pants?|trousers?|shorts|jeans)\\b";

    private static final String JOGGERS = "\\b(?:joggers?|track[ -]?pants?)\\b";
    private static final String SWEATPANTS = "\\b(?:sweat[ -]?pants?|sweats)\\b";

    public record Style(String id, String label, String regex) {}
    public record Option(String id, String label) {}
    private static Style style(String id, String label, String regex) { return new Style(id, label, regex); }

    public static List<Style> groups(String category) {
        String lane = category.trim().toUpperCase(Locale.ROOT);
        return switch (lane) {
            case "JEANS" -> List.of(
                    style("cargo", "Cargo jeans", "cargo"),
                    style("bootcut", "Bootcut & flared", "boot.?cut|bootleg|bell.?bottom|flar"),
                    style("baggy", "Baggy & wide-leg", "baggy|wide.?leg|parallel|loose|relaxed"),
                    style("mom", "Mom & barrel", "mom|barrel"),
                    style("straight", "Straight & classic", ".*"));
            case "TEES" -> List.of(
                    style("polos", "Polos", "\\bpolos?\\b"),
                    style("regular", "Regular", "^regular$|regular.?fit|crew.?neck|fitted|long.?sleeve|turtle.?neck|layering"),
                    style("oversized", "Oversized tees", "oversiz"),
                    style("washed", "Washed & vintage", "wash|vintage|tie.?dye"),
                    style("tops", "Tops & tanks", "tops?|tanks?"),
                    style("graphic", "Graphic tees", "graphic|print|art|slogan|typograph|mytho|illustrat|statement|streetwear|culture"),
                    style("classic", "Classic tees", ".*"));
            case "OUTERWEAR" -> List.of(
                    style("knitwear", "Knitwear", "knit|crochet|cardigan|sweater|pullover"),
                    style("hoodies", "Hoodies & sweats", "hood|sweat"),
                    style("denim", "Denim jackets", "denim"),
                    style("bomber", "Bomber & varsity", "bomber|varsity"),
                    style("overshirts", "Overshirts", "overshirt|shacket"),
                    style("jackets", "Jackets & layers", ".*"));
            case "BOTTOMS" -> List.of(
                    style("shorts", "Shorts", "\\bshorts\\b"),
                    style("cargo", "Cargo pants", "cargo"),
                    style("sweatpants", "Sweatpants", SWEATPANTS),
                    style("joggers", "Joggers", JOGGERS),
                    style("skirts", "Skirts & skorts", "skirt|skort"),
                    style("trousers", "Trousers", ".*"));
            case "ANIME" -> List.of(
                    style("hoodies", "Hoodies", "hood"),
                    style("sweats", "Sweatshirts", "sweat"),
                    style("jackets", "Jackets", "jacket"),
                    style("jerseys", "Jerseys", "jersey"),
                    style("tees", "Tees", ".*"));
            case "SNEAKERS", "SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS", "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS" -> List.of(
                    style("sports", "Sports shoes", "sport|running|training|football|basketball|badminton|cricket|tennis|court"),
                    style("sneakers", "Sneakers", "sneaker"),
                    style("sandals", "Sandals", "sandal"));
            case "SPORTSWEAR" -> List.of(
                    style("football", "Football jerseys", "football"),
                    style("basketball", "Basketball jerseys", "basketball"),
                    style("cricket", "Cricket jerseys", "cricket"),
                    style("gym", "Gym & training", ".*"));
            case "SHIRTS" -> List.of(
                    style("printed", "Printed shirts", "print|ajrakh"),
                    style("embroidered", "Embroidered shirts", "embroider|chikankari"),
                    style("linen", "Linen shirts", "linen"),
                    style("other", "Other shirts", ".*"));
            case "POLOS" -> List.of(
                    style("oversized", "Oversized polos", "oversiz.*polo"),
                    style("performance", "Performance polos", "(performance|sporty|sport).*polo"),
                    style("polos", "Classic polos", "polo"),
                    style("regular", "Regular & layering tees", ".*"));
            case "CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES" -> List.of(
                    style("caps", "Caps", "\\b(caps?|snapbacks?|trucker hats?|baseball hats?)\\b"),
                    style("rings", "Rings", "\\brings?\\b"),
                    style("pendants", "Pendants", "\\bpendants?\\b"),
                    style("bracelets", "Bracelets", "\\bbracelets?\\b"),
                    style("watches", "Watches", "\\b(watches|watch|timepieces?)\\b"));
            default -> List.of();
        };
    }

    static boolean isAccessories(String category) {
        return List.of("CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES")
                .contains(category.trim().toUpperCase(Locale.ROOT));
    }

    public static boolean isShirts(String category) {
        return "SHIRTS".equalsIgnoreCase(category.trim());
    }

    static Document shirtEligibility() {
        Document title = text("$signalProducts.underdog.title");
        Document type = text("$signalProducts.underdog.productType");
        Document identity = new Document("$concat", List.of(title, " ", type));
        Document shirtType = new Document("$and", List.of(regex(type, SHIRT),
                new Document("$not", List.of(regex(type, "\\btops?\\b")))));
        return new Document("$and", List.of(
                new Document("$or", List.of(regex(title, SHIRT), shirtType)),
                new Document("$not", List.of(new Document("$or", List.of(
                        regex(identity, NON_SHIRT), regex(title, OTHER_GARMENT)))))));
    }

    public static boolean isRestricted(String category) {
        return isAccessories(category) || List.of("SNEAKERS", "SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS",
                "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS").contains(category.trim().toUpperCase(Locale.ROOT));
    }

    public static String classify(String category, String subcategory) {
        String text = subcategory == null ? "" : subcategory;
        return groups(category).stream().filter(group -> Pattern.compile(group.regex(), Pattern.CASE_INSENSITIVE).matcher(text).find())
                .map(Style::id).findFirst().orElse("");
    }

    public static List<Option> options(String category, List<String> subcategories) {
        Set<String> available = new HashSet<>();
        subcategories.forEach(value -> available.add(classify(category, value)));
        List<String> displayOrder = switch (category.trim().toUpperCase(Locale.ROOT)) {
            case "JEANS" -> List.of("baggy", "straight", "bootcut", "cargo", "mom");
            case "TEES" -> List.of("graphic", "oversized", "washed", "tops", "classic", "polos", "regular");
            case "BOTTOMS" -> List.of("cargo", "joggers", "sweatpants", "shorts", "skirts", "trousers");
            case "ANIME" -> List.of("tees", "hoodies", "sweats", "jackets", "jerseys");
            case "POLOS" -> List.of("polos", "oversized", "performance", "regular");
            default -> groups(category).stream().map(Style::id).toList();
        };
        return groups(category).stream().filter(group -> isRestricted(category) || available.contains(group.id())
                        || ("TEES".equalsIgnoreCase(category.trim()) && List.of("polos", "regular").contains(group.id()))
                        || ("BOTTOMS".equalsIgnoreCase(category.trim()) && List.of("joggers", "sweatpants", "shorts").contains(group.id()))
                        || ("OUTERWEAR".equalsIgnoreCase(category.trim()) && group.id().equals("knitwear")))
                .sorted(Comparator.comparingInt(group -> displayOrder.indexOf(group.id())))
                .map(group -> new Option(group.id(), group.label())).toList();
    }

    public static Document match(String category, String style) {
        List<Style> groups = groups(category);
        if (groups.stream().noneMatch(group -> group.id().equals(style))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown style for this category");
        }
        return new Document("$eq", List.of(family(category), style));
    }

    static Document allowed(String category) {
        return new Document("$ne", List.of(family(category), ""));
    }

    private static Document family(String category) {
        Document subcategory = text("$subcategory");
        List<Document> branches = new ArrayList<>();
        Document trackOrSweatStyle = subcategory;
        if ("BOTTOMS".equalsIgnoreCase(category.trim())) {
            String pattern = JOGGERS + "|" + SWEATPANTS;
            Document title = text("$signalProducts.underdog.title");
            // Older trackpants and sweatpants slots include products sold as joggers.
            trackOrSweatStyle = new Document("$cond", List.of(
                    new Document("$and", List.of(regex(subcategory, pattern), regex(title, pattern))),
                    title, subcategory));
        }
        for (Style group : groups(category)) {
            Object condition = regex(List.of("joggers", "sweatpants").contains(group.id()) ? trackOrSweatStyle : subcategory,
                    group.regex());
            if ("TEES".equalsIgnoreCase(category.trim()) && group.id().equals("regular")) {
                // Legacy POLOS rows without a polo label are the regular-fit side of that lane.
                condition = new Document("$or", List.of(condition, new Document("$eq", List.of("$category", "POLOS"))));
            }
            branches.add(new Document("case", condition).append("then", group.id()));
        }
        if (isAccessories(category)) {
            // Older accessory records often carry a brand-level label instead of a garment type.
            Document title = text("$signalProducts.underdog.title");
            Document eligible = new Document("$not", List.of(new Document("$or", List.of(
                    regex(subcategory, OTHER_ACCESSORIES), regex(title, OTHER_ACCESSORIES)))));
            for (Style group : groups(category)) {
                branches.add(new Document("case", new Document("$and", List.of(eligible, regex(title, group.regex()))))
                        .append("then", group.id()));
            }
        }
        return new Document("$switch", new Document("branches", branches).append("default", ""));
    }

    private static Document text(String field) {
        return new Document("$convert", new Document("input", field).append("to", "string")
                .append("onError", "").append("onNull", ""));
    }

    private static Document regex(Document input, String pattern) {
        return new Document("$regexMatch", new Document("input", input).append("regex", pattern).append("options", "i"));
    }
}
