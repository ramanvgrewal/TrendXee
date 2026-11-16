package com.trendzy.api.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * An admin-chosen product for one India calendar day. It replaces the automatic
 * lead pick on the homepage for that day only; the Daily Five stays automatic.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "featured_picks")
public class FeaturedPick {
    @Id
    private String date; // yyyy-MM-dd in Asia/Kolkata
    private String trendId;
    private String note; // optional private reminder, e.g. which brand campaign
    private String createdBy;
    private Instant updatedAt;
}
