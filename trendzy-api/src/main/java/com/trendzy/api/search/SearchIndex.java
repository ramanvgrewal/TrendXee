package com.trendzy.api.search;

import com.trendzy.api.model.ApprovedTaxonomy;
import com.trendzy.api.model.ProductAudience;
import com.trendzy.api.model.Trend;
import com.trendzy.api.service.CatalogFilterQuery;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** Immutable snapshot of the visible catalog. Safe to share between requests. */
final class SearchIndex {
    private static final int MAX_SUGGESTIONS = 3;

    private record Item(Trend trend, String audience, String brand, String brandKey, String category, String style,
                        Set<String> title, Set<String> lane, Set<String> tags) {}

    private record Hit(Item item, int tier, int partialWords) {}

    /** Words accepted for one query word. A prefix word may also still be half typed. */
    private record Term(Set<String> words, String prefix) {
        boolean exact(Set<String> field) {
            return words.stream().anyMatch(field::contains);
        }

        boolean matches(Set<String> field) {
            return exact(field) || (prefix != null && field.stream().anyMatch(word -> word.startsWith(prefix)));
        }
    }

    private static final Comparator<Item> BY_SCORE =
            Comparator.comparingDouble((Item item) -> item.trend().getTrendScore()).reversed()
                    .thenComparing(item -> item.trend().getId());

    private final List<Item> items;
    private final Set<String> vocabulary = new HashSet<>();

    SearchIndex(Collection<Trend> trends) {
        items = trends.stream().filter(trend -> trend.getId() != null).map(SearchIndex::item).toList();
        for (Item item : items) {
            vocabulary.addAll(item.title());
            vocabulary.addAll(item.lane());
            vocabulary.addAll(item.tags());
        }
    }

    int size() {
        return items.size();
    }

    SearchResult search(String query, String audience, int page, int size) {
        List<String> words = SearchText.tokens(query);
        List<Item> visible = items.stream().filter(item -> audienceMatches(item, audience)).toList();
        String queryKey = SearchText.compact(query);
        List<Term> terms = strictTerms(words);
        List<Hit> hits = hits(visible, terms, queryKey);
        if (hits.isEmpty() && !words.isEmpty()) {
            terms = typoTerms(words);
            hits = hits(visible, terms, queryKey);
        }
        long offset = (long) page * size;
        List<Trend> content = hits.stream().skip(offset).limit(size).map(hit -> hit.item().trend()).toList();
        return new SearchResult(query, brands(visible, terms, queryKey), styles(visible, terms), content,
                hits.size(), offset + size < hits.size(), page, size, audience);
    }

    private static Item item(Trend trend) {
        Trend.ProductDetail product = trend.getSignalProducts() == null ? null : trend.getSignalProducts().getUnderdog();
        String brand = product == null || product.getBrandName() == null ? "" : product.getBrandName().trim();
        String name = product == null || product.getTitle() == null || product.getTitle().isBlank()
                ? trend.getTrendName() : product.getTitle();
        String audience = ProductAudience.normalize(product == null ? null : product.getAudience());
        String category = CatalogFilterQuery.normalizeCategory(Objects.toString(trend.getCategory(), ""));
        String style = CatalogFilterQuery.currentLabel(category, trend.getSubcategory());

        Set<String> title = new HashSet<>(SearchText.tokens(name));
        title.addAll(SearchText.tokens(brand));
        Set<String> lane = new HashSet<>(SearchText.tokens(style));
        lane.addAll(SearchText.tokens(ApprovedTaxonomy.laneLabel(category)));
        if (!audience.equals("MEN")) lane.add("women");
        if (!audience.equals("WOMEN")) lane.add("men");
        if (audience.equals("UNISEX")) lane.add("unisex");
        Set<String> tags = new HashSet<>();
        if (product != null && product.getTags() != null) {
            for (String tag : product.getTags()) tags.addAll(SearchText.tokens(tag));
        }
        return new Item(trend, audience, brand, SearchText.compact(brand), category, style,
                Set.copyOf(title), Set.copyOf(lane), Set.copyOf(tags));
    }

    private static boolean audienceMatches(Item item, String audience) {
        return switch (audience) {
            case "MEN", "WOMEN" -> item.audience().equals(audience) || item.audience().equals("UNISEX");
            case "UNISEX" -> item.audience().equals("UNISEX");
            default -> true;
        };
    }

    private static List<Term> strictTerms(List<String> words) {
        List<Term> terms = new ArrayList<>();
        for (int i = 0; i < words.size(); i++) {
            boolean last = i == words.size() - 1;
            Set<String> accepted = new HashSet<>(Set.of(words.get(i)));
            if (last && words.get(i).length() >= 3) accepted.addAll(SearchText.synonymsStartingWith(words.get(i)));
            terms.add(new Term(accepted, last ? words.get(i) : null));
        }
        return terms;
    }

    /** Only words the catalog does not know are corrected, and only to their closest spellings. */
    private List<Term> typoTerms(List<String> words) {
        List<Term> terms = new ArrayList<>();
        List<Term> strict = strictTerms(words);
        for (int i = 0; i < words.size(); i++) {
            String word = words.get(i);
            int best = SearchText.allowedTypos(word);
            if (best == 0 || strict.get(i).matches(vocabulary)) {
                terms.add(strict.get(i));
                continue;
            }
            Set<String> closest = new HashSet<>();
            for (String candidate : vocabulary) {
                // A short word must not be "corrected" into a different short word.
                if (SearchText.allowedTypos(candidate) == 0) continue;
                int distance = SearchText.distance(word, candidate, best);
                if (distance > best) continue;
                if (distance < best) {
                    closest.clear();
                    best = distance;
                }
                closest.add(candidate);
            }
            terms.add(new Term(closest, null));
        }
        return terms;
    }

    private static List<Hit> hits(List<Item> visible, List<Term> terms, String queryKey) {
        if (terms.isEmpty()) return List.of();
        return visible.stream().map(item -> hit(item, terms, queryKey)).filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(Hit::tier).thenComparingInt(Hit::partialWords)
                        .thenComparing(Hit::item, BY_SCORE))
                .toList();
    }

    /** Tier 0 exact brand, 1 title and brand, 2 style and lane, 3 retailer tags. */
    private static Hit hit(Item item, List<Term> terms, String queryKey) {
        if (!item.brandKey().isEmpty() && item.brandKey().equals(queryKey)) return new Hit(item, 0, 0);
        int tier = 1;
        int partialWords = 0;
        for (Term term : terms) {
            int field = term.matches(item.title()) ? 1 : term.matches(item.lane()) ? 2 : term.matches(item.tags()) ? 3 : 0;
            if (field == 0) return null;
            Set<String> matched = field == 1 ? item.title() : field == 2 ? item.lane() : item.tags();
            if (!term.exact(matched)) partialWords++;
            tier = Math.max(tier, field);
        }
        return new Hit(item, tier, partialWords);
    }

    private static List<SearchResult.Brand> brands(List<Item> visible, List<Term> terms, String queryKey) {
        if (terms.isEmpty()) return List.of();
        Map<String, List<Item>> byBrand = visible.stream().filter(item -> !item.brandKey().isEmpty())
                .collect(Collectors.groupingBy(Item::brandKey, LinkedHashMap::new, Collectors.toList()));
        return byBrand.entrySet().stream()
                .filter(entry -> {
                    if (entry.getKey().startsWith(queryKey)) return true;
                    Set<String> words = new HashSet<>(SearchText.tokens(entry.getValue().get(0).brand()));
                    return terms.stream().allMatch(term -> term.matches(words));
                })
                .sorted(Comparator.comparing((Map.Entry<String, List<Item>> entry) -> !entry.getKey().equals(queryKey))
                        .thenComparing(entry -> !entry.getKey().startsWith(queryKey))
                        .thenComparing(entry -> -entry.getValue().size())
                        .thenComparing(Map.Entry::getKey))
                .limit(MAX_SUGGESTIONS)
                .map(entry -> new SearchResult.Brand(entry.getValue().get(0).brand(), entry.getValue().size()))
                .toList();
    }

    private static List<SearchResult.Style> styles(List<Item> visible, List<Term> terms) {
        if (terms.isEmpty()) return List.of();
        List<SearchResult.Style> lanes = new ArrayList<>();
        List<SearchResult.Style> styles = new ArrayList<>();
        for (String category : ApprovedTaxonomy.categories()) {
            List<Item> inLane = visible.stream().filter(item -> item.category().equals(category)).toList();
            Set<String> laneWords = new HashSet<>(SearchText.tokens(ApprovedTaxonomy.laneLabel(category)));
            if (!inLane.isEmpty() && terms.stream().allMatch(term -> term.matches(laneWords))) {
                lanes.add(new SearchResult.Style(category, null, inLane.size()));
            }
            for (String label : ApprovedTaxonomy.labels(category)) {
                long count = inLane.stream().filter(item -> label.equals(item.style())).count();
                Set<String> labelWords = new HashSet<>(SearchText.tokens(label));
                if (count > 0 && terms.stream().allMatch(term -> term.matches(labelWords))) {
                    styles.add(new SearchResult.Style(category, label, count));
                }
            }
        }
        styles.sort(Comparator.comparingLong(SearchResult.Style::count).reversed().thenComparing(SearchResult.Style::label));
        lanes.addAll(styles);
        return lanes.stream().limit(MAX_SUGGESTIONS).toList();
    }
}
