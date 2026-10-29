# Journal publishing

The initial blog lives at `/journal`, with article pages at `/journal/:slug`. It is styled with TrendXee's existing typography, clay palette and light/dark themes. Articles render on the server and work independently of the product API. The sitemap reads the same article list, so adding an article adds its URL automatically.

## Publish an article now

1. Add an entry to `trendzy-front/src/content/journal.ts`, newest first.
2. Choose a permanent lowercase hyphenated slug, descriptive title/excerpt, real author and publication date. The current model contains published articles only: do not put private drafts or future articles in the array.
3. Add a short introduction and sections with unique anchor IDs. Use your own copy and images you have permission to publish. Check any product-specific prices or claims against the retailer immediately before release; the starter articles deliberately avoid those claims.
4. Set a relevant lane and link label. Supported decorative covers are discovery, denim and layers; add a new cover deliberately when needed.
5. Run tests, typecheck and build. Review the article on a phone and desktop, including its title, table of contents and outgoing lane link. Deploy through the normal site workflow.

Files are the initial publishing workflow. No dashboard or Tiptap editor has been installed. No database, account or third-party subscription is required for the Journal.

## Why not install an editor immediately?

Tiptap is a good editor for a future writing dashboard, but an editor alone is not a publishing system. Self-service publishing also needs protected write APIs, content storage, preview authorization, revisions, image handling and a safe renderer. Adding only the toolbar would not give you dependable publishing.

Once you want to publish without code changes, keep `/journal` and its permanent article URLs and replace the content source with a protected CMS. Recommended scope:

- Private `/admin/journal` with real server-side admin authorization; never trust a client-side email check for writes.
- Tiptap JSON with an allowlisted schema, draft/save/preview/publish workflow, slug uniqueness and revisions to prevent accidental overwrites.
- Server-rendered public articles from a published revision. Drafts excluded from public loaders, sitemap and metadata; previews require authorization.
- Validated image uploads, safe links and product-reference blocks. Do not embed unrestricted arbitrary HTML.
- Store editorial content separately from the local product ingestion pipeline. Any database target for a future publishing backend must be established explicitly; never synchronize the local product data to Atlas as part of blog publishing.

[Official Tiptap React guide](https://tiptap.dev/docs/editor/getting-started/install/react). Tiptap's SSR setup uses `immediatelyRender: false` for the editor; readers should receive a rendered article without downloading the editor bundle.

## Content rhythm

Publish useful material before broad brand lists that are hard to keep current:

1. Baggy denim proportions and how to check fit — starter article included.
2. Choosing a base layer for jackets — starter article included.
3. How Pair up with chooses suggestions — explain the actual rules and limitations.
4. Reading hype, ratings and missing analytics separately.
5. A real reader's outfit brief, with their permission and current product links.

Each article should answer one practical question and link to one relevant lane. Turn the article into a short demo and invite a specific observation. Add further topics based on actual searches and reader questions; no search-volume or ranking promises are assumed.
