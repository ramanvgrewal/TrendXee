package com.trendzy.api.service;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PairingServiceTest {
    private final TrendRepository repository = mock(TrendRepository.class);
    private final PairingService service = new PairingService(repository);
    @Test void pairingCardsAvoidSendingFullStoriesUntilOpened() {
        var candidate = item("candidate", "Jeans", "JEANS", "WOMEN");
        var p = candidate.getSignalProducts().getUnderdog();
        p.setDescription("A long retailer description");
        p.setImageUrls(List.of("https://store/one.jpg", "https://store/two.jpg"));
        candidate.setAiSummary("A full product story");
        var result = query(item("source", "Tee", "TEES", "WOMEN"), "WOMEN", candidate);
        var card = result.slots().get(0).items().get(0).trend();
        assertEquals(p.getImageUrl(), card.getSignalProducts().getUnderdog().getImageUrl());
        assertNull(card.getSignalProducts().getUnderdog().getDescription());
        assertNull(card.getSignalProducts().getUnderdog().getImageUrls());
        assertNull(card.getAiSummary());
        when(repository.findById("candidate")).thenReturn(Mono.just(candidate));
        assertEquals(2, service.selectedProduct("candidate", p.getShopUrl()).block().getSignalProducts().getUnderdog().getImageUrls().size());
        assertEquals("A long retailer description", p.getDescription());
    }
    @Test void redTopIsNotCalledNeutralBecauseItsCatalogTagsContainBlack() {
        var top = item("top", "Relaxed Cotton Crop Top Red", "TEES", "WOMEN");
        var product = top.getSignalProducts().getUnderdog();
        product.setTags(List.of("Black", "Light Pink"));
        product.setOutfitProfile(Map.of("version", 1, "sourceIdentity", "store.example/products/top",
                "sourceTitle", product.getTitle(), "colors", List.of("RED"), "evidence", Map.of("colors", List.of(
                        Map.of("value", "RED", "source", "title", "excerpt", product.getTitle(), "confidence", .9)))));
        var result = query(item("source", "Jeans", "JEANS", "WOMEN"), "WOMEN", top);
        assertFalse(result.slots().get(0).items().get(0).reason().contains("neutral"));
    }
    private Trend item(String id, String title, String category, String audience) {
        return Trend.builder().id(id).category(category).active(true).enrichmentStatus("COMPLETED")
                .signalProducts(Trend.SignalProducts.builder().underdog(Trend.ProductDetail.builder()
                        .brandName("Brand "+id).title(title).audience(audience).price(1200d)
                        .shopUrl("https://store.example/products/"+id).imageUrl("https://store.example/"+id+".jpg").build()).build()).build();
    }
    private PairingService.Pairings query(Trend source, String audience, Trend... candidates) {
        when(repository.findById(source.getId())).thenReturn(Mono.just(source));
        when(repository.findPairingCandidates(anyList())).thenReturn(Flux.fromArray(candidates));
        return service.pairings(source.getId(),audience,source.getSignalProducts().getUnderdog().getShopUrl()).block();
    }
    @Test void canonicalIdentityKeepsGenericIdsAndCollapsesShopifyVariants() {
        assertEquals(ProductIdentity.canonical("http://www.store.in/collections/all/products/test?variant=1"),
                ProductIdentity.canonical("https://store.in/products/test/?utm_source=test"));
        assertNotEquals(ProductIdentity.canonical("https://store.in/product?id=1"),ProductIdentity.canonical("https://store.in/product?id=2"));
        assertEquals("",ProductIdentity.canonical("javascript:alert(1)"));
    }
    @Test void womenGetWomenSharedAndUnknownButNeverMenOrSameRole() {
        var result = query(item("source","Graphic Tee","TEES","WOMEN"),"ALL",
                item("men","Baggy Jeans","JEANS","MEN"),item("unknown","Baggy Jeans","JEANS","UNKNOWN"),
                item("women","Baggy Jeans","JEANS","WOMEN"),item("shared","Cargo Pants","BOTTOMS","UNISEX"),
                item("same","Graphic Tee","ANIME","WOMEN"));
        assertEquals("WOMEN",result.audience());
        assertEquals(1,result.slots().size());
        assertEquals("BOTTOM",result.slots().get(0).role());
        assertEquals(3,result.slots().get(0).items().size());
        assertTrue(result.slots().get(0).items().stream().anyMatch(i -> i.trend().getId().equals("unknown")
                && i.trend().getSignalProducts().getUnderdog().getAudience().equals("UNISEX")));
    }
    @Test void unknownSourceIsSharedWithoutAnExtraAudienceChoice() {
        var unknown = query(item("a", "Tee", "TEES", "UNKNOWN"), "ALL",
                item("b", "Jeans", "JEANS", "MEN"), item("c", "Jeans", "JEANS", null));
        assertFalse(unknown.needsAudience());
        assertEquals("UNISEX", unknown.audience());
        assertEquals(List.of("c"), unknown.slots().get(0).items().stream().map(i -> i.trend().getId()).toList());
        var result=query(item("a","Tee","TEES","UNISEX"),"ALL",
                item("b","Jeans","JEANS","MEN"),item("c","Jeans","JEANS","UNISEX"));
        assertEquals(List.of("c"),result.slots().get(0).items().stream().map(i->i.trend().getId()).toList());
    }
    @Test void unknownAndMissingCandidatesAppearInBothFiltersWithoutMixingKnownAudiences() {
        for (String audience : List.of("MEN", "WOMEN")) {
            var result = query(item("source", "Tee", "TEES", null), audience,
                    item("unknown", "Jeans", "JEANS", "UNKNOWN"), item("missing", "Jeans", "JEANS", null),
                    item("known", "Jeans", "JEANS", audience),
                    item("other", "Jeans", "JEANS", audience.equals("MEN") ? "WOMEN" : "MEN"));
            assertFalse(result.needsAudience());
            assertEquals(audience, result.audience());
            assertEquals(java.util.Set.of("unknown", "missing", "known"), result.slots().get(0).items().stream()
                    .map(i -> i.trend().getId()).collect(java.util.stream.Collectors.toSet()));
        }
    }
    @Test void currentProductAliasesAndUnavailableProductsAreExcluded() {
        var source=item("source","Graphic Tee","TEES","MEN");
        var alias=item("alias","Jeans","JEANS","MEN");
        alias.getSignalProducts().getUnderdog().setShopUrl("https://store.example/collections/all/products/source?variant=2");
        var sold=item("sold","Jeans","JEANS","MEN"); sold.getSignalProducts().getUnderdog().setAvailable(false);
        var preorder=item("pre","Sneakers","SNEAKERS","MEN"); preorder.getSignalProducts().getUnderdog().setTags(List.of("Pre-order"));
        var archived=item("archived","Jeans","JEANS","MEN"); archived.setEnrichmentStatus("ARCHIVED");
        var inactive=item("inactive","Jeans","JEANS","MEN"); inactive.setActive(false);
        assertTrue(query(source,"MEN",alias,sold,preorder,archived,inactive).slots().isEmpty());
    }
    @Test void candidateIdentityIsDeduplicatedAcrossJeansAndBottoms() {
        var a=item("a","Baggy Jeans","JEANS","MEN");
        var b=item("b","Cargo Pants","BOTTOMS","MEN");
        b.getSignalProducts().getUnderdog().setShopUrl(a.getSignalProducts().getUnderdog().getShopUrl()+"?variant=2");
        assertEquals(1,query(item("source","Tee","TEES","MEN"),"ALL",a,b).slots().get(0).items().size());
    }
    @Test void runningDoesNotRecommendCasualSneakersOrUnrelatedSports() {
        var result=query(item("source","Running Training Top","SPORTSWEAR","MEN"),"MEN",
                item("casual","Street Sneakers","SNEAKERS","MEN"),item("football","Football Shoes","SNEAKERS","MEN"),
                item("running","Running Shoes","SNEAKERS","MEN"));
        assertEquals(List.of("running"),result.slots().get(0).items().stream().map(i->i.trend().getId()).toList());
    }
    @Test void refreshUnderSameIdInvalidatesSourceAndOpeningCandidate() {
        var updated=item("same-id","New Sneakers","SNEAKERS","MEN");
        updated.getSignalProducts().getUnderdog().setShopUrl("https://store.example/products/new");
        when(repository.findById("same-id")).thenReturn(Mono.just(updated));
        var ex=assertThrows(ResponseStatusException.class,()->service.pairings("same-id","ALL","https://store.example/products/old").block());
        assertEquals(409,ex.getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.selectedProduct("same-id","https://store.example/products/old").block());
    }
    @Test void descriptionsDoNotTurnGraphicTeeIntoJeansAndHoodieDoesNotAddLayer() {
        var tee=item("tee","Graphic Tee","ANIME","MEN");
        tee.getSignalProducts().getUnderdog().setDescription("Style with jeans and running shoes.");
        var hoodie=item("source","Anime Hoodie","ANIME","MEN");
        var result=query(hoodie,"MEN",tee,item("layer","Light Jacket","OUTERWEAR","MEN"),item("bottom","Jeans","JEANS","MEN"));
        assertEquals(List.of("BOTTOM"),result.slots().stream().map(PairingService.Slot::role).toList());
    }

    @Test void homepageCollectionAndSearchLinksAreNotSelectedProducts() {
        for (String path : List.of("/", "/?utm_source=campaign", "/collections/tees", "/products", "/search?q=jeans", "/pages/about")) {
            var candidate = item("bad", "Jeans", "JEANS", "MEN");
            candidate.getSignalProducts().getUnderdog().setShopUrl("https://store.example" + path);
            assertFalse(PairingService.eligible(candidate), path);
        }
        assertTrue(ProductIdentity.isProductUrl("https://store.example/?product_id=123"));
        assertTrue(ProductIdentity.isProductUrl("https://store.example/collections/tees/products/a-tee"));
    }

    @Test void staleProfileEvidenceCannotSurviveSameUrlAndTitleMetadataEdit() {
        var candidate = item("piece", "Pebble", "JEANS", "MEN");
        var p = candidate.getSignalProducts().getUnderdog();
        p.setDescription("These are relaxed denim jeans.");
        p.setOutfitProfile(Map.of("version", 1, "sourceIdentity", "store.example/products/piece",
                "sourceTitle", "Pebble", "role", "BOTTOM", "evidence", Map.of("role", List.of(
                        Map.of("value", "BOTTOM", "source", "description", "excerpt", "These are relaxed denim jeans", "confidence", .75)))));
        var source = item("source", "Tee", "TEES", "MEN");
        assertEquals(1, query(source, "MEN", candidate).slots().size());
        p.setDescription("A lightweight embroidered jacket.");
        assertTrue(query(source, "MEN", candidate).slots().isEmpty());
    }

    @Test void staleProfileUrlOrTitleAndBundleRolesAreRejected() {
        var candidate = item("piece", "Two-piece co-ord set", "ANIME", "WOMEN");
        var p = candidate.getSignalProducts().getUnderdog();
        p.setProductType("Tops");
        p.setOutfitProfile(Map.of("version", 1, "sourceIdentity", "store.example/products/piece",
                "sourceTitle", p.getTitle(), "role", "TOP", "evidence", Map.of("role", List.of(
                        Map.of("value", "TOP", "source", "productType", "excerpt", "Tops", "confidence", .95)))));
        assertTrue(query(item("source", "Jeans", "JEANS", "WOMEN"), "ALL", candidate).slots().isEmpty());
        p.setTitle("Pebble"); p.setProductType(null);
        assertTrue(query(item("source", "Jeans", "JEANS", "WOMEN"), "ALL", candidate).slots().isEmpty());
    }

    @Test void bulkyJacketStillGetsTopAndHeavyweightTeeCanGetLightLayer() {
        var top = item("top", "Plain Tee", "TEES", "MEN");
        var jacket = item("jacket", "Padded Puffer Jacket", "OUTERWEAR", "MEN");
        assertEquals("TOP", query(jacket, "MEN", top).slots().get(0).role());
        var heavyweight = item("source", "Heavyweight Tee", "TEES", "MEN");
        var layer = item("layer", "Lightweight Cardigan", "OUTERWEAR", "MEN");
        assertEquals("LAYER", query(heavyweight, "MEN", layer).slots().get(0).role());
    }

    @Test void lifestyleGraphicActivityWordsDoNotEstablishSportsCapability() {
        var source = item("source", "Running Training Top", "SPORTSWEAR", "MEN");
        var lifestyle = item("lifestyle", "Running Shoes Inspired Lifestyle Edition", "SNEAKERS", "MEN");
        var graphic = item("graphic", "Football Culture Graphic Jersey", "SPORTSWEAR", "MEN");
        assertTrue(query(source, "MEN", lifestyle, graphic).slots().isEmpty());
        var real = item("real", "Training Shoes", "SNEAKERS", "MEN");
        assertTrue(query(source, "MEN", real).slots().get(0).items().get(0).reason().contains("training"));
    }

    @Test void approvedCasualShoeTypesCanPairButNeverSubstituteForSportsShoes() {
        for (String title : List.of("Leather Flats", "Embroidered Juttis", "Sandals", "Slides", "Clogs", "Mules", "Sneakers")) {
            var shoes = item("shoe", title, "SNEAKERS", "WOMEN");
            assertEquals("SHOES", query(item("tee", "Tee", "TEES", "WOMEN"), "ALL", shoes).slots().get(0).role());
            assertTrue(query(item("sport", "Running Training Top", "SPORTSWEAR", "WOMEN"), "ALL", shoes).slots().isEmpty());
        }
    }

    @Test void allKnownUnavailableStatesAndPresaleFlagsAreExcluded() {
        for (String state : List.of("OUT_OF_STOCK", "PREORDER", "DISCONTINUED", "https://schema.org/OutOfStock", "BACKORDER", "PRE_SALE")) {
            var candidate = item("bad", "Jeans", "JEANS", "MEN");
            candidate.getSignalProducts().getUnderdog().setAvailability(state);
            assertFalse(PairingService.eligible(candidate), state);
        }
        var candidate = item("bad", "Jeans", "JEANS", "MEN");
        candidate.getSignalProducts().getUnderdog().setTags(List.of("Pre-sale"));
        assertFalse(PairingService.eligible(candidate));
    }

    @Test void sourceGenderAndGlobalFilterIntersectAndUnknownUsesSelectedFilter() {
        var women = item("women", "Jeans", "JEANS", "WOMEN");
        var men = item("men", "Jeans", "JEANS", "MEN");
        var shared = item("shared", "Jeans", "JEANS", "UNISEX");
        var conflicted = query(item("source", "Tee", "TEES", "WOMEN"), "MEN", women, men, shared);
        assertEquals("UNISEX", conflicted.audience());
        assertEquals(List.of("shared"), conflicted.slots().get(0).items().stream().map(i -> i.trend().getId()).toList());
        var chosen = query(item("source", "Tee", "TEES", "UNKNOWN"), "WOMEN", women, men, shared);
        assertFalse(chosen.needsAudience());
        assertEquals(2, chosen.slots().get(0).items().size());
    }

    @Test void rolesAndAlternativesAreBoundedAndEachRequestReadsCurrentCatalog() {
        var source = item("source", "Oversized Tee", "TEES", "MEN");
        var candidates = new ArrayList<Trend>();
        for (int i = 0; i < 8; i++) candidates.add(item("bottom" + i, "Straight Jeans", "JEANS", "MEN"));
        candidates.add(item("shoe", "Sneakers", "SNEAKERS", "MEN"));
        candidates.add(item("hat", "Cap", "CAPS", "MEN"));
        candidates.add(item("bag", "Bag", "CAPS", "MEN"));
        var result = query(source, "ALL", candidates.toArray(Trend[]::new));
        assertEquals(3, result.slots().size());
        assertTrue(result.slots().stream().allMatch(slot -> slot.items().size() <= 4));
        when(repository.findPairingCandidates(anyList())).thenReturn(Flux.empty());
        assertTrue(service.pairings("source", "ALL", null).block().slots().isEmpty());
        verify(repository, times(2)).findPairingCandidates(anyList());
        verify(repository, times(2)).findById("source");
    }

    @Test void scrapedPageCodeAndStylingAdviceCannotValidateProfileFacts() {
        var candidate = item("piece", "Pebble", "JEANS", "MEN");
        var p = candidate.getSignalProducts().getUnderdog();
        for (String description : List.of("/* Jeans colors */ .jeans { color: black; }", "Style with jeans for an easy look.")) {
            p.setDescription(description);
            p.setOutfitProfile(Map.of("version", 1, "sourceIdentity", "store.example/products/piece", "sourceTitle", "Pebble",
                    "role", "BOTTOM", "evidence", Map.of("role", List.of(Map.of("value", "BOTTOM", "source", "description",
                            "excerpt", description, "confidence", .9)))));
            assertTrue(query(item("source", "Tee", "TEES", "MEN"), "MEN", candidate).slots().isEmpty());
        }
    }

    @Test void strongStyleCompatibilityOutranksHypeAndOldTrendTagsDoNotRankProducts() {
        var source = item("source", "Oversized Graphic Tee", "TEES", "MEN");
        var compatible = item("compatible", "Plain Straight Jeans", "JEANS", "MEN");
        compatible.setTrendScore(0);
        var hyped = item("hyped", "Graphic Skinny Jeans", "JEANS", "MEN");
        hyped.setTrendScore(100);
        hyped.setVibeTags(List.of("plain", "relaxed", "neutral"));
        var result = query(source, "MEN", hyped, compatible);
        assertEquals("compatible", result.slots().get(0).items().get(0).trend().getId());
        assertFalse(result.slots().get(0).items().get(1).reason().contains("plain"));
    }

    @Test void badmintonKeepsItsOwnActivityInsteadOfAssumingAnySportsShoeWorks() {
        var result = query(item("source", "Badminton Performance Jersey", "SPORTSWEAR", "MEN"), "MEN",
                item("correct", "Badminton Shoes", "SNEAKERS", "MEN"), item("wrong", "Running Shoes", "SNEAKERS", "MEN"));
        assertEquals(List.of("correct"), result.slots().get(0).items().stream().map(i -> i.trend().getId()).toList());
    }
}
