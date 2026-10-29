package com.trendzy.api.service;

import com.trendzy.api.model.Trend;
import com.trendzy.api.repository.TrendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PairingServiceTest {
    private final TrendRepository repository = mock(TrendRepository.class);
    private final PairingService service = new PairingService(repository);

    private Trend item(String id, String title, String category, String audience) {
        return Trend.builder().id(id).category(category).active(true).enrichmentStatus("COMPLETED")
                .signalProducts(Trend.SignalProducts.builder().underdog(Trend.ProductDetail.builder()
                        .brandName("Brand "+id).title(title).audience(audience).price(1200d)
                        .shopUrl("https://store.example/products/"+id).imageUrl("https://store.example/"+id+".jpg").build()).build()).build();
    }
    private PairingService.Pairings query(Trend source, String audience) {
        when(repository.findById(source.getId())).thenReturn(Mono.just(source));
        return service.pairings(source.getId(), audience, source.getSignalProducts().getUnderdog().getShopUrl()).block();
    }
    private VisualOutfitService missingReview() {
        var visual = mock(VisualOutfitService.class);
        when(visual.recommend(any(), anyString(), anySet(), any(), any(), anyList(), any())).thenReturn(Mono.empty());
        service.setVisualOutfits(visual);
        return visual;
    }

    @Test void missingReviewNeverQueriesOrRanksMetadataCandidates() {
        var source = item("source", "Baggy Jeans", "JEANS", "MEN");
        for (boolean enabled : List.of(false, true)) {
            if (enabled) missingReview();
            var result = query(source, "ALL");
            assertEquals("curation-pending", result.engine());
            assertEquals("MEN", result.audience());
            assertTrue(result.slots().isEmpty());
            assertNull(result.outfitId());
            assertNull(result.feedbackToken());
        }
        verify(repository, times(2)).findById("source");
        verifyNoMoreInteractions(repository);
    }
    @Test void reviewedCompleteOutfitIsForwardedWithoutIndependentChanges() {
        var source = item("source", "Tee", "TEES", "MEN");
        var visual = missingReview();
        var reviewed = new PairingService.Pairings("identity", "MEN", false, List.of(), "vision-v2",
                "look", "assistant-curated", "A reviewed complete look.", List.of("SHOES"), "impression", "receipt");
        when(visual.recommend(eq(source), anyString(), anySet(), any(), any(), anyList(), any())).thenReturn(Mono.just(reviewed));
        assertSame(reviewed, query(source, "ALL"));
        verify(repository, times(1)).findById("source");
        verifyNoMoreInteractions(repository);
    }
    @Test void missingReviewedSwapIsConflictRatherThanAnIndependentReplacement() {
        missingReview();
        var source = item("source", "Tee", "TEES", "MEN");
        when(repository.findById("source")).thenReturn(Mono.just(source));
        var error = assertThrows(ResponseStatusException.class,
                () -> service.pairings("source", "MEN", null, "old-look", "BOTTOM", List.of(), null).block());
        assertEquals(409, error.getStatusCode().value());
        verify(repository, times(1)).findById("source");
        verifyNoMoreInteractions(repository);
    }
    @Test void knownAudienceOverridesStaleBrowsingPreferenceForReviewedBank() {
        var visual = missingReview();
        for (String gender : List.of("WOMEN", "MEN")) {
            var source = item("source", "Flare Fit Jeans", "JEANS", gender);
            for (String requested : List.of("ALL", "MEN", "WOMEN")) {
                assertEquals(gender, query(source, requested).audience());
            }
            verify(visual, times(3)).recommend(eq(source), eq(gender), eq(Set.of(gender, "UNISEX")), isNull(), isNull(), eq(List.of()), isNull());
        }
    }
    @Test void unknownAndSharedSourcesUseSharedOrRequestedAudience() {
        var visual = missingReview();
        for (String gender : new String[]{null, "UNKNOWN", "UNISEX"}) {
            var source = item("source", "Sweatshirt", "ANIME", gender);
            assertEquals("UNISEX", query(source, "ALL").audience());
            for (String requested : List.of("MEN", "WOMEN")) {
                assertEquals(requested, query(source, requested).audience());
                verify(visual).recommend(eq(source), eq(requested), eq(Set.of(requested, "UNISEX")), isNull(), isNull(), eq(List.of()), isNull());
            }
            clearInvocations(visual);
        }
    }
    @Test void pairingCardsAvoidSendingFullStoriesUntilOpened() {
        var candidate = item("candidate", "Jeans", "JEANS", "WOMEN");
        var p = candidate.getSignalProducts().getUnderdog();
        p.setDescription("A long retailer description");
        p.setImageUrls(List.of("https://store/one.jpg", "https://store/two.jpg"));
        candidate.setAiSummary("A full product story");
        var card = PairingService.cardPreview(candidate);
        assertEquals(p.getImageUrl(), card.getSignalProducts().getUnderdog().getImageUrl());
        assertNull(card.getSignalProducts().getUnderdog().getDescription());
        assertNull(card.getSignalProducts().getUnderdog().getImageUrls());
        assertNull(card.getAiSummary());
        when(repository.findById("candidate")).thenReturn(Mono.just(candidate));
        assertEquals(2, service.selectedProduct("candidate", p.getShopUrl()).block().getSignalProducts().getUnderdog().getImageUrls().size());
    }
    @Test void canonicalIdentityKeepsGenericIdsAndCollapsesShopifyVariants() {
        assertEquals(ProductIdentity.canonical("http://www.store.in/collections/all/products/test?variant=1"),
                ProductIdentity.canonical("https://store.in/products/test/?utm_source=test"));
        assertNotEquals(ProductIdentity.canonical("https://store.in/product?id=1"), ProductIdentity.canonical("https://store.in/product?id=2"));
        assertEquals("", ProductIdentity.canonical("javascript:alert(1)"));
    }
    @Test void refreshUnderSameIdInvalidatesSourceAndOpeningCandidate() {
        var updated = item("same-id", "New Sneakers", "SNEAKERS", "MEN");
        updated.getSignalProducts().getUnderdog().setShopUrl("https://store.example/products/new");
        when(repository.findById("same-id")).thenReturn(Mono.just(updated));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.pairings("same-id", "ALL", "https://store.example/products/old").block()).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> service.selectedProduct("same-id", "https://store.example/products/old").block());
        verify(repository, times(2)).findById("same-id");
        verifyNoMoreInteractions(repository);
    }
    @Test void invalidAudienceAndSourceIdentityAreRejected() {
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.pairings("source", "kids", null).block()).getStatusCode().value());
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.selectedProduct("source", "javascript:bad").block()).getStatusCode().value());
    }
    @Test void missingOrUnavailableSourceIsNotServed() {
        when(repository.findById("missing")).thenReturn(Mono.empty());
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.selectedProduct("missing", null).block()).getStatusCode().value());
        var source = item("sold", "Jeans", "JEANS", "MEN");
        source.getSignalProducts().getUnderdog().setAvailable(false);
        when(repository.findById("sold")).thenReturn(Mono.just(source));
        assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.selectedProduct("sold", null).block()).getStatusCode().value());
    }
    @Test void physicalRolesAndLayeringRemainHardConstraints() {
        var tee = item("tee", "Graphic Tee", "ANIME", "MEN");
        tee.getSignalProducts().getUnderdog().setDescription("Style with jeans and running shoes.");
        assertEquals("TOP", PairingService.outfitRole(tee));
        for (String title : List.of("Anime Hoodie", "Wool Sweater", "Knitted Vest")) {
            var layer = item("layer", title, "OUTERWEAR", "MEN");
            assertEquals("LAYER", PairingService.outfitRole(layer));
            assertFalse(PairingService.outfitCompatible(layer, tee));
            assertTrue(PairingService.outfitCompatible(layer, item("bottom", "Baggy Jeans", "JEANS", "MEN")));
        }
        assertTrue(PairingService.outfitCompatible(tee, item("jacket", "Padded Puffer Jacket", "OUTERWEAR", "MEN")));
        assertTrue(PairingService.outfitCompatible(tee, item("cardigan", "Lightweight Cardigan", "OUTERWEAR", "MEN")));
    }
    @Test void sportsShoesKeepActivitySpecificEligibility() {
        var running = item("source", "Running Training Top", "SPORTSWEAR", "MEN");
        for (String title : List.of("Street Sneakers", "Football Shoes", "Running Shoes Inspired Lifestyle Edition", "Leather Flats", "Juttis", "Sandals"))
            assertFalse(PairingService.outfitCompatible(running, item("shoe", title, "SNEAKERS", "MEN")), title);
        assertTrue(PairingService.outfitCompatible(running, item("shoe", "Running Shoes", "SNEAKERS", "MEN")));
        var badminton = item("source", "Badminton Performance Jersey", "SPORTSWEAR", "MEN");
        assertTrue(PairingService.outfitCompatible(badminton, item("shoe", "Badminton Shoes", "SNEAKERS", "MEN")));
        assertFalse(PairingService.outfitCompatible(badminton, item("shoe", "Running Shoes", "SNEAKERS", "MEN")));
    }
    @Test void unsupportedProfileEvidenceAndBundlesDoNotEstablishPhysicalRole() {
        var candidate = item("piece", "Pebble", "JEANS", "MEN");
        var p = candidate.getSignalProducts().getUnderdog();
        for (String description : List.of("/* Jeans colors */ .jeans { color: black; }", "Style with jeans for an easy look.")) {
            p.setDescription(description);
            p.setOutfitProfile(Map.of("version", 1, "sourceIdentity", "store.example/products/piece", "sourceTitle", "Pebble",
                    "role", "BOTTOM", "evidence", Map.of("role", List.of(Map.of("value", "BOTTOM", "source", "description", "excerpt", description, "confidence", .9)))));
            assertEquals("UNKNOWN", PairingService.outfitRole(candidate));
        }
        assertEquals("UNKNOWN", PairingService.outfitRole(item("set", "Two-piece co-ord set", "ANIME", "WOMEN")));
    }
    @Test void homepageCollectionAndSearchLinksAreNotSelectedProducts() {
        for (String path : List.of("/", "/?utm_source=campaign", "/collections/tees", "/products", "/search?q=jeans", "/pages/about")) {
            var candidate = item("bad", "Jeans", "JEANS", "MEN");
            candidate.getSignalProducts().getUnderdog().setShopUrl("https://store.example" + path);
            assertFalse(PairingService.eligible(candidate), path);
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
        candidate.getSignalProducts().getUnderdog().setTags(List.of());
        candidate.setActive(false);
        assertFalse(PairingService.eligible(candidate));
    }
}
