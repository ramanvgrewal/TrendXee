package com.trendzy.api.service;

import org.bson.Document;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.regex.Pattern;

/** Small, ordered style families. Raw scraper labels remain intact for product provenance. */
public final class CatalogStyles {
    private CatalogStyles() {}
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
                    style("oversized", "Oversized tees", "oversiz"),
                    style("washed", "Washed & vintage", "wash|vintage|tie.?dye"),
                    style("tops", "Tops & tanks", "tops?|tanks?"),
                    style("graphic", "Graphic tees", "graphic|print|art|slogan|typograph|mytho|illustrat|statement|streetwear|culture"),
                    style("classic", "Classic tees", ".*"));
            case "OUTERWEAR" -> List.of(
                    style("hoodies", "Hoodies & sweats", "hood|sweat"),
                    style("denim", "Denim jackets", "denim"),
                    style("bomber", "Bomber & varsity", "bomber|varsity"),
                    style("overshirts", "Knitwear & overshirts", "overshirt|shacket|knit|crochet|cardigan|sweater|pullover"),
                    style("jackets", "Jackets & layers", ".*"));
            case "BOTTOMS" -> List.of(
                    style("cargo", "Cargo pants", "cargo"),
                    style("sweats", "Joggers & sweats", "jogger|sweat|track"),
                    style("shorts", "Shorts", "short"),
                    style("skirts", "Skirts & skorts", "skirt|skort"),
                    style("trousers", "Trousers", ".*"));
            case "ANIME" -> List.of(
                    style("hoodies", "Hoodies", "hood"),
                    style("sweats", "Sweatshirts", "sweat"),
                    style("jackets", "Jackets", "jacket"),
                    style("jerseys", "Jerseys", "jersey"),
                    style("tees", "Tees", ".*"));
            case "SNEAKERS", "SHOES", "SNEAKER & SPORTS", "SNEAKERS & SPORTS", "SNEAKER_SPORTS", "SNEAKERS_AND_SPORTS" -> List.of(
                    style("sneakers", "Sneakers", "sneaker"),
                    style("sports", "Sports shoes", "sport|running|training|football|badminton|cricket|court"),
                    style("sandals", "Sandals & slides", "sandal|slide|clog|slipper|flip.?flop"),
                    style("loafers", "Loafers & mules", "loafer|mule"),
                    style("flats", "Flats & everyday", ".*"));
            case "SPORTSWEAR" -> List.of(
                    style("football", "Football jerseys", "football"),
                    style("basketball", "Basketball jerseys", "basketball"),
                    style("cricket", "Cricket jerseys", "cricket"),
                    style("gym", "Gym & training", ".*"));
            case "POLOS" -> List.of(
                    style("oversized", "Oversized polos", "oversiz.*polo"),
                    style("performance", "Performance polos", "(performance|sporty|sport).*polo"),
                    style("polos", "Classic polos", "polo"),
                    style("regular", "Regular & layering tees", ".*"));
            case "CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES" -> List.of(
                    style("bags", "Bags & wallets", "bag|tote|wallet"),
                    style("jewellery", "Jewellery", "jewel|necklace|ring|bracelet|earring"),
                    style("sunglasses", "Sunglasses", "sunglass|eyewear"),
                    style("belts", "Belts", "belt"),
                    style("caps", "Caps & hats", ".*"));
            default -> List.of();
        };
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
            case "TEES" -> List.of("graphic", "oversized", "washed", "tops", "classic");
            case "ANIME" -> List.of("tees", "hoodies", "sweats", "jackets", "jerseys");
            case "POLOS" -> List.of("polos", "oversized", "performance", "regular");
            case "CAPS", "ACCESSORIES", "CAPS_ACCESSORIES", "CAPS & ACCESSORIES", "CAPS_AND_ACCESSORIES" -> List.of("caps", "bags", "jewellery", "belts", "sunglasses");
            default -> groups(category).stream().map(Style::id).toList();
        };
        return groups(category).stream().filter(group -> available.contains(group.id()))
                .sorted(Comparator.comparingInt(group -> displayOrder.indexOf(group.id())))
                .map(group -> new Option(group.id(), group.label())).toList();
    }

    public static Document match(String category, String style) {
        List<Style> groups = groups(category);
        if (groups.stream().noneMatch(group -> group.id().equals(style))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown style for this category");
        }
        Document input = new Document("$convert", new Document("input", "$subcategory").append("to", "string").append("onError", "").append("onNull", ""));
        List<Document> branches = groups.subList(0, groups.size() - 1).stream().map(group ->
                new Document("case", new Document("$regexMatch", new Document("input", input).append("regex", group.regex()).append("options", "i")))
                        .append("then", group.id())).toList();
        Document family = new Document("$switch", new Document("branches", branches).append("default", groups.get(groups.size() - 1).id()));
        return new Document("$eq", List.of(family, style));
    }
}
