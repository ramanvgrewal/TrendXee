# SEO and site essentials

Audited on 29 October 2026. Results describe the local production build; they do
not confirm the status of a hosted release.
The owner confirmed that Google Search Console is already verified. Its account
and indexing reports were not inspected during the initial 29 October audit.

## Google account and live-site follow-up — 30 October 2026

The verified Search Console domain property is `trendxee.com`.
`https://www.trendxee.com/sitemap.xml` was submitted successfully on 30 October;
Google immediately reported **Success** and **19 discovered pages**. URL
Inspection confirmed that the canonical www homepage is already indexed, with
crawling and indexing allowed. A fresh homepage indexing request was accepted
and added to Google's priority crawl queue.

The overview reported 15 indexed URLs and 152 search clicks. The Page Indexing
report was last updated on 23 October, so its 13 excluded URLs are historical
evidence rather than a current count of broken public pages: five 404s, five
redirects, one duplicate without a selected canonical, and two crawled URLs not
currently indexed. The homepage inspection's older 29 October crawl did not
record a declared canonical; the current live HTML contains the correct
`https://www.trendxee.com/` canonical.

The live robots file and sitemap return 200. All 19 sitemap URLs were checked:
each returned 200, an indexable robots directive, a self canonical, a unique
title and one H1. The homepage renders its content and Organization/WebSite
structured data on the server. The HTTPS apex permanently redirects to www.

GA4's stream uses `G-6RWGTJR8LM`, matching the global production tag. Enhanced
Measurement is enabled. A public browser check sent one page view on initial
load and one on normal navigation to About, with successful Google collection
responses and no duplicate page views. The signed-in Realtime report also showed
one recent active user with `page_view`, `session_start` and `first_visit` events.
The stream settings' older "no data in 48 hours" warning did not reflect this
Realtime receipt. This confirms current collection, not historical traffic
completeness or conversion tracking.

## Search-discovery improvements prepared after the follow-up

These source changes require a frontend release; the Google account actions
above are already complete.

- Give the homepage a descriptive search title identifying TrendXee as Indian
  indie fashion discovery while keeping its visible slogan.
- Describe clothing, shoes and accessories in the lanes index title and intro.
- Give the three existing Journal articles concise search titles while keeping
  their editorial headings and original publication dates.
- Add ordinary crawlable links from relevant clothing lanes to the existing
  denim and layering guides, on the first page of each lane.
- Permanently redirect the historical `/aesthetic/upper` lane to
  `/aesthetic/tees`, retaining query parameters. Repository history confirms
  this was a rename of the TEES lane. `/aesthetic/accessories` already redirects
  correctly to `/aesthetic/caps`. Retired streetwear URLs without an equivalent,
  literal route templates such as `/aesthetic/$id`, and the auth service root
  are not redirected to unrelated catalog pages.

Validation for this update: all 43 frontend tests, TypeScript checks and the
production build passed. The built site was checked with isolated API fixtures
across 11 rendered routes. The redirect returned HTTP 301 and retained its query;
the new guide links were present in the initial server HTML. Guide navigation
worked at 1440, 390 and 320 px without horizontal overflow or browser page errors.
The preview made no production API or database requests. The existing build
warnings about Vite/Nitro compatibility, client chunk size and dependency
directives did not prevent the build.

For brand consistency, use **TrendXee** and `https://www.trendxee.com` on owned
profiles and future launch copy. Older public launch copy used "TrendZee" for
the website; that name now belongs to the separate local processing pipeline.
No social profiles or posts were changed by this audit.

Google controls indexing and rankings. A successful sitemap submission or crawl
request does not guarantee a position for the brand query or other searches.

## Coverage

### Search visibility follow-up — 1 November 2026

An actual Google results check for `trendxee` with English/India settings showed
"These are results for trendzee" and offered "Search instead for trendxee".
The displayed results were for unrelated Trendzee businesses. This spelling
correction is a concrete brand-discovery obstacle; it does not mean that the
TrendXee homepage is absent from Google's index. The exact-spelling follow-up
encountered an unusual-traffic check, which was not bypassed, so an exact-query
rank was not established.

The live homepage still used the old slogan title, and
`/trending-streetwear` and `/aesthetic/upper` still returned 404. The changes
prepared above had not reached production at the time of this check.

The expanded update gives the homepage the title **TrendXee — Discover Fashion
Trends & Indian Indie Brands**, adds explicit visible TrendXee identity and a
clear fashion-discovery introduction, and adds `/trending-streetwear` with the
title **Discover Trending Streetwear Brands in India | TrendXee**. The new page
contains five relevant clothing/accessory lanes, current catalog imagery when
available, practical buying guidance, and the existing denim/layering guides.
It is linked from the homepage, footer, desktop lanes menu and mobile menu, has
a matching breadcrumb and canonical, and brings the sitemap to 20 public URLs.
These titles and descriptions express the desired listing; Google can choose
different wording and rankings.

Target the clear fashion intent in "discover fashion trends in India" and
"Indian streetwear brands" alongside the unique **TrendXee** brand. Avoid
creating near-duplicate pages for every variation of "discover trends". Use the
same TrendXee spelling and canonical website address across owned public profiles.

Expanded-update validation passed: 43 frontend tests, TypeScript, the production
build, and all 20 sitemap pages checked over HTTP with JavaScript disabled.
Each page returned 200 with a unique title, one H1, an indexable robots value and
a matching canonical. The streetwear page's five category links, two guide
links and breadcrumb render on the server. Desktop navigation and mobile menu
navigation worked at 1440, 390 and 320 px without page errors or horizontal
overflow. These checks use isolated API fixtures and do not write to a database.

### Initial 29 October coverage

| # | Item | Result |
| --- | --- | --- |
| 1 | Server-side rendering | TanStack Start already renders public pages on the server. Checked the returned HTML without running JavaScript. |
| 2 | robots.txt | Added a public file with the canonical sitemap URL. API and server-function paths are excluded; assets stay crawlable. |
| 3 | sitemap.xml | Added the public pages, nine lanes and published Journal articles. Article dates use their real publication dates. Private, filtered and missing pages are excluded. |
| 4 | Unique titles | Shared SEO helper gives each public route its own title. Pagination and active filters include context. |
| 5 | Meta descriptions | Added route-specific descriptions and consistent social descriptions. |
| 6 | One H1 | Checked public pages, account callback and error pages. Callback status now has a heading. |
| 7 | Canonicals | Public pages use `https://www.trendxee.com`. Unfiltered category pagination is self-canonical. Filters and product dialogs point to their category list and are noindex. |
| 8 | Open Graph images | Every page has an absolute 1200 × 630 branded PNG URL, alt text and Twitter large-card metadata. PNG is retained for social-preview compatibility. |
| 9 | Custom 404 | Existing branded page retained; missing routes and articles return HTTP 404, a dedicated title and noindex metadata. |
| 10 | Permanent redirects | Added 301 redirects for `/blog`, `/aesthetic/shoes`, `/aesthetic/accessories`, `/aesthetic/polos-and-regular` and trailing slashes. Queries are preserved. The existing live apex-to-www redirect returns 308, which is also permanent. Unknown paths stay 404. |
| 11 | Alt text | Product cards and category photography use descriptive product/category text. Decorative images keep empty alt attributes. Audited rendered pages have no missing alt attributes. |
| 12 | WebP images | Common product thumbnails use a bounded Sharp optimizer and cache for approved CDNs. Failed or unsupported sources use their originals. Original gallery photographs remain available for zoom. |
| 13 | Lazy loading | Below-fold photography uses native lazy loading. Priority hero photographs remain eager. |
| 14 | Organization schema | Added factual Organization and WebSite JSON-LD with the site, logo and contact mailbox. No invented address, ratings or merchant offers. |
| 15 | Breadcrumbs | Added visible internal breadcrumbs and matching BreadcrumbList JSON-LD on public subpages. |
| 16 | Internal links | Header, footer, lanes, Journal and breadcrumbs are linked. Category pagination now uses crawlable links. |
| 17 | Google Analytics | Existing root GA4 tag `G-6RWGTJR8LM` is shared by all routes. Development traffic and the saved opt-out disable collection. No second page-view emitter was added. Dashboard receipt was not independently checked. |
| 18 | Search Console | Already verified, as confirmed by the owner. Preserve the existing verification. Submit or refresh the sitemap after release. |
| 19 | Privacy policy | Existing public page retained and updated with contact handling. It also explains analytics and external retailers. |
| 20 | Contact form | Added `/contact`, shared with the contact dialog. Guests can submit. The API validates input, uses a honeypot and rate limits, keeps the configured sender, sets the visitor as Reply-To and reports delivery failures. SMTP delivery still needs a real release-environment check. |

## Verification

Final results: 41 frontend tests, 13 business contact/security tests and 289 HTTP
assertions passed. The HTTP audit covered 19 public sitemap pages and 24 page
variants, including pagination, filters, account status and missing routes.
TypeScript, the production frontend build and the business API package passed.

- Frontend tests include SEO metadata, redirect rules, safe JSON-LD, image URL
  validation, real WebP encoding, cache revalidation and download deduplication.
- Business tests exercise valid and invalid messages, header-injection rejection,
  honeypots, request limits, mail failure responses, anonymous access and CORS.
  The mail sender is mocked; these tests never send real email.
- The production build is checked over HTTP for public HTML, canonical tags,
  one H1, social metadata, structured data, pagination, redirects, 404s, robots
  and sitemap responses. Original gallery photos are not rewritten.
- Desktop and mobile contact layouts were inspected. A disconnected local mail
  service produces a clear error and preserves the visitor's draft.

## Release checks

The live site returned 404 for both `/robots.txt` and `/sitemap.xml` before these
changes. Local checks do not change the hosted website.

1. Release the frontend and business API together. Install Sharp on the target
   platform, or use a build pipeline that packages its matching native binary.
2. Configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
   `CONTACT_FROM` and `CONTACT_TO`. The from-address must be permitted by the SMTP
   provider. Send one test message and confirm its arrival and Reply-To address.
3. Check `https://www.trendxee.com/robots.txt` and
   `https://www.trendxee.com/sitemap.xml` return 200. Check an image request returns
   `image/webp` and the original product gallery still zooms clearly.
4. Submit `https://www.trendxee.com/sitemap.xml` in the already-verified Search
   Console property. Use URL Inspection on the homepage, a category and an article.
5. Confirm GA4 receives a real production visit. Enhanced Measurement should
   track History API navigation; avoid adding a duplicate router page-view event.

The audit did not run product ingestion or database writes. Publishing this code
does not transfer local catalog data or reviewed outfits to Atlas. Search engines
decide indexing and rankings; tags do not guarantee either.

## References

- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google: Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google: Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Sharp: output formats](https://sharp.pixelplumbing.com/api-output/)
