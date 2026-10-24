# Pair up with — implementation and design

Implemented locally on 21 October 2026. The catalog audit below is the original
19 October baseline, not the current inventory count. Product processing and
backfills target local MongoDB `trendzy`; Atlas remains manually managed.

## Implemented behavior

- Read-only pairing endpoint returns at most three complementary roles, with
  up to four current product alternatives each. Compact previews load lazily;
  complete galleries are fetched only when opening a revalidated candidate.
- Current selected product identities, audience, stock exclusions and physical
  roles are hard gates. Stored profile evidence is checked against current
  retailer fields. No LLM runs on product opening and no server result cache can
  retain a replaced product. Responses use `Cache-Control: no-store`.
- Compact product rows show all three roles together, with a small portrait,
  price and independent Swap control. Candidates open in the same dialog;
  return restores choices, story scroll and focus. Full-screen photo zoom
  remains available when opening a product.
- Men/Women include shared fits. Products without a known audience default to
  Unisex and appear in both. This fallback is recorded separately from retailer
  evidence so future classification can refine it. Empty, failed and stale
  responses leave the original story usable.
- Checks cover 320px, 390px and 1440px, touch swipe, candidate gallery, keyboard
  buttons, return state, swap exhaustion, error/empty states and replaced products.

## Recommendation

Show a small **Pair up with** section in the product story after the selected
underdog's shop/save block, before marketplace lookalikes. Start with up to three
complementary pieces from currently visible underdog products. The third slot can
be a layer or accessory when there is a good match. Quality takes priority
over filling every slot.

Each suggestion shows its actual product photo, brand, title, price, garment role,
and one short supported reason. Examples of reason types: “A relaxed silhouette
for an oversized tee” or “A neutral layer for a graphic top.” These are styling
suggestions, not guarantees of personal fit or exact color coordination.

On mobile use compact rows that keep all complementary roles visible together.
Tapping a suggestion opens its normal product story and full gallery. Preserve an explicit
way back to the starting piece, without stacking multiple product dialogs. A
“Swap” button swaps only that role, excludes the current option, and stops
when alternatives are exhausted. The chosen outfit stays stable while browsing.

Fetch suggestions lazily; product photos and the main story must work even if
pairing retrieval fails. Hide unsupported slots rather than inventing products.

## Inventory actually present

192 trend documents; 182 distinct selected products pass the current public-feed
eligibility rules and have a photo, shop link and positive price. The remaining
10 documents do not pass public eligibility. These figures do not verify live
retailer inventory. Men/Women counts include the same unisex products and must
not be added together.

| Lane | Current picks | Men incl. unisex | Women incl. unisex |
| --- | ---: | ---: | ---: |
| Tees | 37 | 25 | 22 |
| Outerwear | 21 | 16 | 9 |
| Jeans | 21 | 6 | 7 |
| Bottoms | 14 | 7 | 7 |
| Anime | 40 | 15 | 16 |
| Shoes | 13 | 5 | 4 |
| Sportswear | 23 | 8 | 1 |
| Polos | 6 | 4 | 1 |
| Caps & accessories | 7 | 2 | 2 |

100 current picks have confirmed MEN/WOMEN/UNISEX classification; 82 remain
UNKNOWN in this historical audit. The current policy defaults these products
to Unisex, including them in both Men and Women.
There are also 1,142 unique product URLs in eligible trends' curated pools, but
none of those pool entries has a persisted availability field. Pool products
are potential future inventory, not automatically eligible recommendations.

Current selected metadata coverage: descriptions 141/182, product types 101/182,
retailer tags 90/182, AI styleVibe 175/182. No selected product has dedicated
color, fit, material, availability or stockCheckedAt fields in this audit. Some
of these attributes can be extracted from existing retailer text. Generic
styleVibe values are weak hints, not verified attributes.

## Match the garment, not just the lane

Keep the nine public lanes. Add internal outfit roles:
TOP, BOTTOM, LAYER, SHOES, HEADWEAR, BAG, BELT, JEWELRY, EYEWEAR.
Anime is a theme spanning tees, jerseys, hoodies and jackets; its lane alone is
insufficient to determine an outfit role. Jeans and Bottoms share the BOTTOM role.
Sweatshirts/hoodies also need layering information so two bulky layers are not
blindly combined.

| Opened piece | Primary complementary slots | Optional slot |
| --- | --- | --- |
| Tee, polo or anime tee | One jeans/bottoms item + shoes | Layer or accessory |
| Jeans or bottoms | One top + shoes | Layer or accessory |
| Jacket | One compatible top + one bottoms item | Shoes |
| Hoodie or sweatshirt | One bottoms item + shoes | Accessory |
| Sneakers | One top + one bottoms item | Layer/accessory |
| Sports top or performance shoes | Activity-compatible top/bottom counterpart | Verified sports shoes/accessory |
| Accessory | One top + one bottoms item | Shoes |

Do not fill both Jeans and Bottoms as though they were two pieces of one outfit.
Different bottom options are alternatives in a single slot.

## Eligibility and audience

1. Active and publicly eligible current product with a real image and shop URL.
2. Exclude the starting product by canonical product URL, including variants and
   tracking aliases. Deduplicate across all lanes and slots by the same identity.
3. Exclude known sold-out, discontinued or unsupported pre-order products. Keep
   IN_STOCK, OUT_OF_STOCK, PREORDER and UNKNOWN distinct, with evidence and check
   time. A successful refresh timestamp alone is not an inventory check.
4. A MEN source pairs with MEN/UNISEX; WOMEN with WOMEN/UNISEX. Respect the current
   global Men/Women filter. An explicitly gendered source remains authoritative
   when opened from All or a direct link.
5. A UNISEX source under All initially gets unisex matches, with an optional
   “Style for Men / Women” choice to expand the selection. Unknown/missing
   audiences use the same Unisex fallback. This is a catalog browsing rule,
   not a sizing inference from the model photo.
6. Never suggest a known incompatible outfit role/activity. A street sneaker is
   not evidence of a suitable running/training shoe. Do not promise size fit.

## Matching and evidence

Build a product-level style profile from title, product type, retailer tags and
description. Normalize garment role, primary/secondary color families, pattern
intensity, silhouette, material, style and occasion. Store evidence, confidence
and profile version for each inferred attribute. Use UNKNOWN when evidence is
missing. Existing trend-level vibeTags may belong to a previous selected product
and must not be treated as verified current-product attributes.

Start with explainable compatibility rules: appropriate roles and audience are
hard gates; coherent style, color family, silhouette and occasion are ranking
signals. Consider price range and brand diversity as softer preferences. Hype
and trust can break ties, but must not outrank a poor clothing match. Avoid false
precision such as an uncalibrated “98% outfit match.”

The AI worker can enrich uncertain style profiles offline and optionally review
shortlists. Validate all returned choices against actual candidate identities
and hard gates. Never call an LLM on every product opening; precomputed profiles
and server ranking avoid adding Groq rate-limit delays to browsing. No image
analysis is needed for a first version; later visual features should describe
the garment and must not infer the model's identity or the garment's audience.

## Implementation outline

1. TrendZee preserves product-level inventory evidence from scrapes instead of
   dropping it during curation. It builds/rebuilds style profiles using canonical
   URL + selected-variant evidence + content fingerprint. Backfill/recheck only
   local MongoDB with dry-run reporting and backups before applying changes.
2. Add a read-only TrendXee API endpoint, for example
   `GET /api/v2/trends/{id}/pairings?audience=WOMEN`, backed by a matching service.
   Retrieve candidates across all relevant lanes, not the frontend's five-item
   lane previews. Return source fingerprint, role-grouped candidates, reason,
   evidence freshness and an empty result when confidence is insufficient.
3. Revalidate source/candidate eligibility when serving. Key caches by source
   canonical identity, audience, profile/rules version and catalog revision.
   A refresh can replace a product without changing trendId; either endpoint of
   a pairing changing must invalidate it. Never attach previous-product reasons
   to the new image/title in that slot.
4. Add the lazy, mobile-friendly product-story section with loading/empty/error
   states, preserved starting-product navigation and independent role swapping.
5. Later, verified pool products can use a stable product collection and detail
   identity. Do not link a pool product to a trend URL that opens a different
   selected product. The user continues to publish Atlas data manually.

Acceptance checks: audience isolation; role/activity compatibility; canonical URL
deduplication; exact source exclusion; same-trend-ID product refresh; candidate
refresh/removal; unavailable inventory; no weak-match padding; swaps without
immediate repeats; return navigation; mobile gallery and keyboard access.

## Enrichment priorities

There is sufficient breadth for an initial casualwear version after metadata and
stock checks. Prioritize verified audience labels for the 82 UNKNOWN products
before adding large quantities of new brands. Then add:

- More women's/unisex shoes and neutral casual sneakers. All 13 eligible current
  shoes are in the Sneakers subcategory; no Sports Shoes picks were present.
- Accessories with confirmed audience and precise types. Only two current picks
  have a confirmed shared audience, and one carries a Discontinued retailer tag
  needing verification. A confirmed-audience shoe also has a pre-order tag.
- Plain/low-pattern tops and simple layers to balance the graphic-heavy catalog.
- More women's polos and gym/sports tops (one shared option per lane currently).
- More neutral straight/relaxed bottoms and diverse women's denim silhouettes.

Do not describe these counts as “in stock now”: current stock is not established
by this read-only database audit.
