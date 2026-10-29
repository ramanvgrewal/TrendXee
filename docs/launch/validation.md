# Local validation — 27 October 2026

Changes are local and have not been deployed, posted to social platforms or submitted to directories. No product records or Atlas data were changed.

- Frontend tests: **26 passed**, including Journal URL/anchor invariants, missing-article lookup and India publication date formatting.
- TypeScript: **passed** after the final route changes.
- Production build: **passed** after the final UI/metadata changes.
- Browser checks: **passed** against both Vite development and the built production server, using headless Microsoft Edge.
- Widths checked: **320, 390, 768, 1440 pixels**. No horizontal page overflow on the Journal index or article pages.
- Checked index → article navigation, article contents links, mobile menu navigation/closure, clipboard share fallback, light/dark rendering, all three article URLs and unknown article HTTP404.
- Confirmed server-rendered article metadata and BlogPosting JSON-LD, an HTTP200 XML sitemap with **16 URLs**, robots.txt and the 1200×630 PNG social image.
- No browser runtime errors appeared in these targeted flows.
- `git diff --check`: passed. CSV files parsed successfully.

Browser screenshots and the one-off smoke harness are in the workspace `.qa/journal-launch-20261027` area, outside the repository. The OS native share dialog was not tested; browser checks exercised clipboard fallback. These checks do not establish full production accessibility, performance, account-flow or mobile-device coverage.

The build still reports existing bundler warnings about the Vite version range, large shared chunks and ignored dependency `use client` directives. They did not prevent the build or tested routes from working. No dependency upgrade was attempted as part of this change.

Remaining launch preparation: deploy and recheck public URLs, configure referral/event measurement, make guest feedback easy, capture the working production demo, and review posts before publishing them.
