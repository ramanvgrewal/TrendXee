# Pair up with

The product story shows one saved, visually reviewed complete outfit. The source
garment is part of the outfit, not an independent search query for each slot.
No Groq key, provider request or model training is used by this feature.

## Review and serving

The local workflow lives in TrendZee's `trendzy-outfits/`. An assistant inspects
catalog photos together, records explicit approvals, and publishes approved sets
to local MongoDB `outfit_recommendations`. Historical review receipts retain their
original provenance. Production data publication remains the owner's manual step.

Review considers colour, wash, silhouette, texture, pattern and layering across
the whole combination. Approval is bound to exact product fingerprints and image
board hashes. A refreshed garment needs a new review. No metadata ranking fills
an unreviewed gap, and optional accessories are not added just to fill space.

The public API revalidates identities, audience, stock, currency, duplicate roles,
physical layering and sport suitability. Pack reads are cached for 30 seconds;
products are checked live. Missing or expired approval returns an empty
`curation-pending` result. No inference infrastructure is needed by the public API.

## API

`GET /api/v2/trends/{id}/pairings?audience=ALL&sourceIdentity=<retailer-url>`

A reviewed response uses `engine: vision-v2`, one item per complementary role,
`outfitId`, a complete-look `reason` and `swappableRoles`. The engine identifier
is a stored-contract version; it does not mean a model is called during browsing.
`audience` accepts ALL, MEN or WOMEN. A known source audience wins over a stale
browsing preference. Shared fits use Unisex products only.

For a swap, add `lookId`, `swapRole` and repeated `exclude` retailer identities.
The server selects another reviewed set with every other member identical. A
quality floor prevents repeated swaps drifting to weaker reviewed combinations.
No suitable swap returns 404; changed or stale membership returns 409. The UI
retains the current look on a failed request and stops repeating seen options.

Opening a recommended card revalidates its retailer identity before loading the
full story and gallery. A refreshed trend ID cannot silently open a different item.
The browser rejects legacy, partial, duplicate or mixed-audience outfit responses.

## User experience and feedback

Compact image rows, prices and separate 44px swap controls work on mobile and
desktop. The explanation describes the whole outfit. Shared items can be styled
for Men or Women without changing the source garment's sizing evidence. Returning
from a suggested product preserves the outfit, choices, scroll and focus.

Optional signed feedback records impressions, opens, saves, retailer clicks and
swaps through `POST /api/v2/outfits/events`. It is disabled by default and respects
`trendxee:analytics=off`. An event must belong to the signed outfit. Receipt replay
is deduplicated, and events expire after 90 days. Clicks are not purchases; swaps
are not automatic dislikes. No training uses these events.

Tests cover complete membership, fixed-piece swaps, replacement conflicts,
audience corrections, eligibility and malformed responses. Assistant approvals
and historical model-judged evaluations are not evidence of human preference gains.
