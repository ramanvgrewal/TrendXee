# Data model

MongoDB database `trendzy` is shared by the catalog API and the local TrendZee
pipeline. The processing pipeline writes local MongoDB only; the owner updates
Atlas manually. PostgreSQL account data belongs to the business API.

## Collections

| Collection | Owner and contents |
| --- | --- |
| `trends` | TrendZee selects products and writes retailer evidence, stories and hype |
| `v2_signals` | TrendZee scrape requests, processing claims and outcomes |
| `outfit_recommendations` | Explicit local review workflow; saved complete outfit sets |
| `outfit_events` | Catalog API; signed, expiring outfit interaction events |
| `archived_trends` | Catalog API; user saves |
| `brand_reviews`, `brand_stats` | Catalog API; community reviews and rating aggregates |
| `product_clicks` | Business API; retailer-link analytics |

Missing optional collections are created when a feature first writes data.

## Trend document

| Field | Shape and meaning |
| --- | --- |
| `_id` | Stable trend ID; it can later select a different retailer product |
| `name` | Stored display headline; Java maps this to `trendName` |
| `category`, `subcategory` | Stored lane and garment family |
| `active` | Whether the product is on the public board |
| `enrichmentStatus` | Pipeline state, independent of stock or hype |
| `signalProducts.underdog` | Current selected retailer product |
| `signalProducts.amazon`, `signalProducts.flipkart` | Optional marketplace comparisons |
| `underdogProductsPool`, `recentUnderdogs`, `underdogPoolIndex` | Worker selection candidates and history |
| `productSelectionFocus` | Fit, garment or activity constraints retained across refreshes |
| `productRefreshedAt`, `lastProductRefreshAttemptAt`, `lastProductRefreshStatus` | Product refresh history |
| `trendScore`, `brandInstagramHandle`, `brandHypeSignals`, `trendScoreUpdatedAt` | Brand Instagram audit |
| `underdogRating`, `ratingSignals` | Brand trust evidence |
| `userRatingAverage`, `userRatingCount`, `brandExperienceComments` | Community-owned data |
| `firstDetectedAt`, `lastUpdatedAt` | BSON dates for record history |

The Java API intentionally maps fewer fields than the worker stores. It must not
save that smaller model over an entire document. Update only fields owned by the
operation so candidate pools, history and retailer evidence survive.

Public lane names differ from stored identifiers: Shoes uses `SNEAKERS`,
Polos & Regular uses `POLOS`, and Caps & accessories accepts `CAPS` and `ACCESSORIES`.
The application normalizes aliases at its boundaries.

## Selected product

Products have a real `shopUrl`, `title`, positive numeric `price`, INR `currency`
and original `imageUrl`/`imageUrls`. `originalPrice` is optional. Audience is
`MEN`, `WOMEN` or `UNISEX`; `audienceSource` records the evidence. Unknown legacy
audiences are read as Unisex. Optional `available`, `inStock`, `availability` and
`stockCheckedAt` retain retailer inventory evidence. Unknown stock is not confirmed stock.

Retailer attributes can be strings, lists or structured values. Keep those flexible
fields and the legacy gender aliases until an explicit migration is reviewed.
`outfitProfile` contains evidence-backed physical role/activity facts. It does not
approve styling or rank independent recommendations.

Legacy hype timestamps may be epoch milliseconds; readers support both those and
BSON dates. New writes should use BSON dates. Missing or null optional evidence
means unknown, not zero, false or an empty successful audit.

## Status lifecycle

The worker sets `PENDING` after selecting a product. The ingestion service's
enrichment scheduler selects active `PENDING` or missing/null statuses and writes
`COMPLETED`, `PARTIAL` or `FAILED`. `COMPLETED` is not selected again by that job.
Other historical states remain readable when a valid selected product exists.

Marking a record completed does not run scraping, finish a queued Kafka request,
calculate hype or validate stock. A later explicitly requested refresh can create
new work and set a pending state. Status-only maintenance is available in TrendZee's
`scripts/catalog_status.py`, with local destination checks and a mandatory backup.

## Reviewed outfits

Schema version 2 packs bind `sourceId`, `sourceFingerprint`, `audience`,
`initialLookId`, `looks` and expiry. A look contains three or four current members
with exact IDs, retailer identities, content fingerprints and physical roles.
Each has a complete-look explanation and review provenance. Fingerprints include
product content and audience, so a replacement or gender correction invalidates
old membership. Score or status changes alone do not invalidate a visual review.

The API rechecks every member's content, audience, stock, currency, role and
layering. Missing or expired reviews return empty `curation-pending` results.
See [Pair up with](../design/pair-up-with.md) for swaps and feedback.
