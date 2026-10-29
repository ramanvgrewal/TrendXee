# SEO and site essentials

Audited on 29 October 2026. Results describe the local production build; they do
not confirm the status of a hosted release.
The owner confirmed that Google Search Console is already verified. Its account
and indexing reports were not inspected during this audit.

## Coverage

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
