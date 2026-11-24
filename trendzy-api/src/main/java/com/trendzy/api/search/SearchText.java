package com.trendzy.api.search;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Turns catalog text and queries into the same comparable words. */
final class SearchText {
    private SearchText() {}

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern APOSTROPHES = Pattern.compile("['’`]");
    private static final Pattern SEPARATORS = Pattern.compile("[^\\p{L}\\p{N}]+");
    // "t-shirt" is one word. Shorter endings keep it one word while it is still being typed.
    private static final Pattern SPLIT_TSHIRT = Pattern.compile("\\bt (sh(?:i(?:r(?:ts?)?)?)?)\\b");
    private static final Pattern SPLIT_COMPOUND = Pattern.compile("\\b(track|sweat|over) (pants?|shirts?)\\b");
    private static final Set<String> IGNORED = Set.of("a", "an", "and", "for", "in", "of", "the", "with");

    private static final Map<String, String> SYNONYMS = Map.ofEntries(
            Map.entry("tshirt", "tee"),
            Map.entry("hoody", "hoodie"),
            Map.entry("spec", "eyewear"),
            Map.entry("shoe", "sneaker"),
            Map.entry("footwear", "sneaker"),
            Map.entry("jewelry", "jewellery"),
            Map.entry("gray", "grey"),
            Map.entry("man", "men"),
            Map.entry("guy", "men"),
            Map.entry("woman", "women"),
            Map.entry("lady", "women"),
            Map.entry("girl", "women"));

    /** Words of a text. Filler words are dropped unless there is nothing else. */
    static List<String> tokens(String text) {
        String plain = plain(text);
        if (plain.isEmpty()) return List.of();
        List<String> words = new ArrayList<>();
        for (String word : plain.split(" ")) words.add(canonical(word));
        List<String> meaningful = words.stream().filter(word -> !IGNORED.contains(word)).toList();
        return meaningful.isEmpty() ? List.copyOf(words) : meaningful;
    }

    /** Brand names compare without spaces or punctuation: "Bonkers Corner" = "bonkerscorner". */
    static String compact(String text) {
        return plain(text).replace(" ", "");
    }

    /** Targets of synonyms that a half-typed word could still become. */
    static List<String> synonymsStartingWith(String prefix) {
        return SYNONYMS.entrySet().stream().filter(entry -> entry.getKey().startsWith(prefix))
                .map(Map.Entry::getValue).distinct().toList();
    }

    private static String plain(String text) {
        if (text == null) return "";
        String value = MARKS.matcher(Normalizer.normalize(text, Normalizer.Form.NFKD)).replaceAll("");
        value = APOSTROPHES.matcher(value.toLowerCase(Locale.ROOT)).replaceAll("");
        value = SEPARATORS.matcher(value).replaceAll(" ").trim();
        value = SPLIT_TSHIRT.matcher(value).replaceAll("t$1");
        return SPLIT_COMPOUND.matcher(value).replaceAll("$1$2");
    }

    private static String canonical(String word) {
        String singular = singular(word);
        return SYNONYMS.getOrDefault(singular, singular);
    }

    private static String singular(String word) {
        if (word.length() < 4 || !word.endsWith("s") || word.endsWith("ss")) return word;
        if (word.endsWith("ies")) return word.substring(0, word.length() - 3) + "y";
        if (word.endsWith("sses") || word.endsWith("ches") || word.endsWith("shes") || word.endsWith("xes")) {
            return word.substring(0, word.length() - 2);
        }
        return word.substring(0, word.length() - 1);
    }

    static int allowedTypos(String word) {
        if (word.chars().anyMatch(Character::isDigit)) return 0;
        return word.length() >= 8 ? 2 : word.length() >= 5 ? 1 : 0;
    }

    /** Edits between two words, counting swapped neighbours as one edit. Returns max + 1 when further apart. */
    static int distance(String a, String b, int max) {
        if (Math.abs(a.length() - b.length()) > max) return max + 1;
        int[][] cost = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) cost[i][0] = i;
        for (int j = 0; j <= b.length(); j++) cost[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int change = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cost[i][j] = Math.min(Math.min(cost[i - 1][j], cost[i][j - 1]) + 1, cost[i - 1][j - 1] + change);
                if (i > 1 && j > 1 && a.charAt(i - 1) == b.charAt(j - 2) && a.charAt(i - 2) == b.charAt(j - 1)) {
                    cost[i][j] = Math.min(cost[i][j], cost[i - 2][j - 2] + 1);
                }
            }
        }
        return Math.min(cost[a.length()][b.length()], max + 1);
    }
}
