package com.trendzy.api.service;

import com.trendzy.api.model.Trend;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class VisualOutfitServiceTest {
    static Trend item(String id, String title) {
        return Trend.builder().id(id).active(true).category(title.contains("jeans") ? "JEANS" : title.contains("sneakers") ? "SNEAKERS" : "TEES")
            .enrichmentStatus("COMPLETED").signalProducts(Trend.SignalProducts.builder().underdog(Trend.ProductDetail.builder()
            .title(title).shopUrl("https://shop.test/products/"+id).imageUrl("https://cdn.test/"+id+".jpg")
            .audience("UNISEX").price(1000.).currency("INR").build()).build()).build();
    }
    static Document member(Trend t) {
        var p=t.getSignalProducts().getUnderdog();
        return new Document("trendId",t.getId()).append("role",PairingService.outfitRole(t))
            .append("identity",ProductIdentity.canonical(p.getShopUrl())).append("fingerprint",OutfitFingerprint.of(p));
    }
    static Document look(String id, Trend... items) {
        return new Document("id",id).append("score",8.).append("reason","The dark denim balances the clean white tee and minimal sneakers.")
            .append("review",new Document("method","complete-outfit-images").append("uncertain",false))
            .append("members",Arrays.stream(items).map(VisualOutfitServiceTest::member).toList());
    }
    @Test void liveEligibilityAndContentChangesInvalidateAnOtherwiseCachedLook() {
        var source=item("a","White tee"); var bottom=item("b","Baggy jeans"); var shoes=item("c","White sneakers");
        var row=look("look",source,bottom,shoes); var current=new HashMap<>(Map.of("a",source,"b",bottom,"c",shoes));
        assertTrue(VisualOutfitService.valid(row,source,Set.of("UNISEX"),current));
        bottom.getSignalProducts().getUnderdog().setTitle("Blue baggy jeans");
        assertFalse(VisualOutfitService.valid(row,source,Set.of("UNISEX"),current));
        bottom.getSignalProducts().getUnderdog().setTitle("Baggy jeans"); bottom.getSignalProducts().getUnderdog().setAvailable(false);
        assertFalse(VisualOutfitService.valid(row,source,Set.of("UNISEX"),current));
    }
    @Test void swapsPreserveEveryFixedProductRatherThanIndependentlySelectingAnotherShoe() {
        var a=item("a","White tee"); var b=item("b","Baggy jeans"); var c=item("c","White sneakers");
        var b2=item("b2","Grey baggy jeans"); var c2=item("c2","Black sneakers");
        var original=look("original",a,b,c); var correct=look("correct",a,b2,c); var changesTwo=look("bad",a,b2,c2);
        var choices=List.of(original,correct,changesTwo);
        assertEquals(List.of(correct),VisualOutfitService.swaps(original,"BOTTOM",choices,"a",List.of()));
        assertTrue(VisualOutfitService.swaps(original,"BOTTOM",choices,"a",List.of(ProductIdentity.canonical(b2.getSignalProducts().getUnderdog().getShopUrl()))).isEmpty());
    }
    @Test void duplicateRolesAudienceConflictsUnreviewedAndIncoherentActivityFailClosed() {
        var a=item("a","White tee"); var b=item("b","Baggy jeans"); var c=item("c","Running shoes");
        assertFalse(VisualOutfitService.valid(look("sport",a,b,c),a,Set.of("UNISEX"),Map.of("a",a,"b",b,"c",c)));
        c=item("c","White sneakers"); c.getSignalProducts().getUnderdog().setAudience("WOMEN");
        assertFalse(VisualOutfitService.valid(look("gender",a,b,c),a,Set.of("MEN","UNISEX"),Map.of("a",a,"b",b,"c",c)));
        c.getSignalProducts().getUnderdog().setAudience("UNISEX"); var row=look("uncertain",a,b,c);
        row.get("review",Document.class).put("uncertain",true);
        assertFalse(VisualOutfitService.valid(row,a,Set.of("UNISEX"),Map.of("a",a,"b",b,"c",c)));
    }
    @Test void fingerprintMatchesPythonUtf8Contract() {
        var p=Trend.ProductDetail.builder().title("Café tee").productType("Tee").shopUrl("https://shop.test/products/a?variant=7")
            .imageUrl("https://cdn.test/a.jpg").description("Cotton").tags(List.of("white","relaxed"))
            .imageUrls(List.of("https://cdn.test/a.jpg")).audience("UNKNOWN").build();
        // Verified against the Python fixture; a URL variant is not a new garment.
        assertEquals("f44d4b9156cecd2d674ee60bcd9c563224813d229620489805e10040a254c642",OutfitFingerprint.of(p));
    }
}
