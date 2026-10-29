# Development and release

## Services and configuration

The website uses ports 3000 (frontend), 8080 (catalog API) and 8081 (business API).
Only TrendZee uses 8082. Starting TrendXee does not start scraping or enrichment.

Copy the root `.env.example` to `.env`. Java reads `../.env` when started inside
a service directory; Vite also reads the root. Local catalog work uses
`mongodb://localhost:27017/trendzy`. Accounts use PostgreSQL and generated RSA keys.
Start the business API only when working on sign-in or account features.

Public API documentation is available at `/swagger-ui.html` on each API service.
Normal builds and unit tests do not require running the services or real AI keys.

| Setting | Purpose |
| --- | --- |
| `MONGODB_URI` | Database read by this app; production is configured separately |
| `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD` | Business API PostgreSQL connection |
| `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH` | Matching RSA keys for sign-in and validation |
| `VITE_API_BASE_URL`, `VITE_BUSINESS_API_BASE_URL` | Frontend service URLs |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `COOKIE_DOMAIN`, `COOKIE_SECURE`, `FRONTEND_URL` | Environment-specific cookies and redirects |
| `OUTFIT_VISUAL_ENABLED` | Enables saved reviewed-outfit serving; default true |
| `OUTFIT_FEEDBACK_ENABLED`, `OUTFIT_FEEDBACK_SECRET` | Optional signed outfit events; default off |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Contact email delivery |
| `CONTACT_FROM`, `CONTACT_TO` | SMTP-approved sender and support mailbox |

The feedback secret signs event receipts. It is not an AI key. Use at least 32
characters when enabling feedback. Never put secrets in `VITE_` settings, which
can be included in browser code.

The public contact page works without sign-in. Configure a sender your SMTP
provider permits; the visitor's address is used only as Reply-To. Tests mock email
delivery, so verify one real delivery after configuring the release environment.

Product thumbnails use the server's Sharp image library and a bounded in-memory
WebP cache. Install production dependencies on the target platform so Sharp's
native binary matches it. Only approved public image CDNs are fetched; unsupported
sources and failed transformations fall back to the original image. Full gallery
photos remain unchanged for zoom. See [the SEO audit](seo-audit.md) for coverage
and release checks.

## Verification

Use the root README commands, or run `powershell -File scripts/verify.ps1` on
Windows. Frontend checks cover catalog normalization, filters, pagination, prices,
the daily board, reviewed pairings, Journal and GA4 configuration. Java tests use
mocks and fixtures; they do not write the owner's local database or Atlas.

For visible changes, inspect desktop and mobile, keyboard navigation, empty/error
states and reduced motion. Do not publish screenshots or fixtures containing keys.

## Release

`docker-compose.prod.yml`, `docker-compose.ec2.yml`, `nginx-trendxee.conf` and
`setup-ec2.sh` belong to deployment. Keep their database and secret configuration
separate from local processing. Use [.env.production.example](../.env.production.example)
as a production settings reference; do not deploy the local development template.
The existing GitHub deployment workflow builds the
two Java images and updates EC2 on a push to `main`. Frontend hosting is separate.

Before pushing, run checks and `git diff --check`, review changed files and verify
that secrets and local artifacts are ignored. Database exports and reviewed outfit
packs are not transferred by a Git push. The owner manages Atlas publication.
