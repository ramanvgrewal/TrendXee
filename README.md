# TrendXee

TrendXee helps people discover Indian fashion brands, browse their products and
put together outfits. It links to retailers; it does not sell or fulfil orders.

This repository contains the website and public APIs. Catalog ingestion runs in
the separate [TrendZee repository](https://github.com/ramanvgrewal/TrendZee).

## Start here

| Path | Responsibility |
| --- | --- |
| `trendzy-front/` | React 19, TanStack Start, TypeScript and Tailwind website |
| `trendzy-api/` | Spring WebFlux catalog, reviews, archive and outfit API; port 8080 |
| `trendzy-business/` | Spring MVC accounts, Google sign-in, contact and click analytics; port 8081 |
| `design/pair-up-with.md` | Reviewed outfits, swaps and feedback contract |
| `docs/data-model.md` | MongoDB collections and field ownership |
| `docs/development.md` | Setup, tests and release notes |
| `docs/seo-audit.md` | SEO coverage, contact delivery and release verification |
| `docs/launch/` | Launch copy and publishing assets |
| `scripts/` | Contributor tools; not application runtime code |

For code navigation and review conventions, read [CONTRIBUTING.md](CONTRIBUTING.md).

## Run locally

Use Java 17 or later, Maven 3.9, Node.js 22 and MongoDB 7. PostgreSQL is needed
for accounts; the catalog and website can be developed separately.

Copy `.env.example` to an untracked root `.env`. Its defaults target local services.
Generate development JWT keys once with `java scripts/GenerateKeys.java`; the
helper refuses to overwrite existing keys. Never commit key files or credentials.

Run each service from its own directory:

```sh
# trendzy-api/
mvn spring-boot:run

# trendzy-business/ (requires local PostgreSQL and OAuth settings for sign-in)
mvn spring-boot:run

# trendzy-front/
npm ci
npm run dev
```

The site runs at http://localhost:3000. Development requests use local APIs by
default. `VITE_API_BASE_URL` and `VITE_BUSINESS_API_BASE_URL` can override them.
Vite reads the repository-root environment file. Production endpoints, databases,
cookies and keys must be configured separately; see [development](docs/development.md).

## Product behavior

- Nine lanes use paginated catalog results and a compact gender/style filter.
  Unisex products appear for both Men and Women.
- Instagram analytics determine brand hype. Uncalculated hype is displayed as zero.
- The daily board uses the current day in India and changes at midnight there.
- Product stories include original galleries, zoom, saves and retailer links.
- Pair up with serves saved, reviewed complete outfits. A missing or stale review
  returns no picks. Swaps preserve every other garment; no Groq call runs here.
- Journal articles are file-backed in `trendzy-front/src/content/`.
- GA4 is configured in the root layout, with development traffic and the existing
  analytics opt-out respected.

## Check changes

```sh
# trendzy-front/
npm test
npm run typecheck
npm run build

# repository root
mvn -f trendzy-api/pom.xml test package
mvn -f trendzy-business/pom.xml test package
```

`scripts/verify.ps1` runs these checks together on Windows. GitHub checks run them
without connecting to a live database or an AI provider. The existing deployment
workflow publishes the Java services on a push to `main`; preparing a change does
not require pushing or deploying it.

## Data ownership

TrendZee processing and maintenance write only to local MongoDB `trendzy`.
The owner publishes catalog data to Atlas manually. Do not run ingestion against
the production database or add automatic local-to-Atlas synchronization.
Keep product identities, audience evidence, review history and outfit fingerprints
when changing documents. Use field updates for narrow edits instead of replacing
whole documents with the public API's smaller model.
