# TrendXee launch kit

Prepared 27 October 2026. These files contain launch copy and planning material. LinkedIn and X have since been published and Product Hunt scheduled with user authorization. Reddit accepted a submission to r/SideProject, then removed it through Reddit's filters. See [publishing status](publishing-status.md) for verified links and timing. Other platforms remain unposted.

**Positioning:** Discover Indian indie fashion, compare pieces across nine lanes, and build an outfit around a drop you like.

Lead with the shopper's problem: finding smaller labels and putting an outfit together. Explain the technology when the audience asks. Avoid claims that every brand is verified, every review is a verified purchase, every product is original, or a score guarantees quality. Do not imply physical wear-testing or real-time stock guarantees.

## Use the channels differently

| Channel | Best role for TrendXee | What to show | Ask |
| --- | --- | --- | --- |
| Reddit, where community rules permit | Learn from Indian shoppers | One genuine browsing or styling problem; disclose that you built the site | What stops you trusting a new clothing label? |
| LinkedIn | Founder story, early testers, brand connections | Why you built it and a short working demo | Try one lane and describe the confusing part |
| X / Twitter | Short visual demonstrations and iteration updates | 20–40 second product walkthrough; one improvement per follow-up | Which pairing would you swap? |
| Product Hunt | A focused product launch and maker conversation | Product gallery, working site, maker comment | Try it and leave feedback |
| Hacker News | Technical feedback from builders | Working product and concrete engineering decisions | How would you improve freshness or ranking? |
| Rivelo Labs | Secondary directory listing | Clear description and current screenshots | Visit the working product |

Rivelo Labs was identified at https://www.rivelolabs.com/ and advertises a free app/website directory. It can be a small extra listing; no audience or traffic promise is assumed. No paid listings are needed for this plan.

These are fit judgments, not traffic forecasts. Reddit is not blanket permission to promote: check the exact community and current thread before posting. r/IndianFashionAddicts is not cleared for promotion by this audit; its rules page did not expose complete rules without login.

## Sequence

1. Deploy and verify the Journal, social image, robots file and sitemap changes. Inspect actual mobile and desktop production pages after deployment.
2. Test guest browsing → lane → product → pairing → retailer link, and signed-in archive/review flows. Confirm usable data on production separately from local MongoDB; the local refresh does not update Atlas.
3. Make guest feedback easy. Current header/footer Contact opens sign-in for guests; remove that friction or provide a clearly monitored feedback destination before recruiting testers.
4. Configure referral attribution and a small event funnel. Existing analytics record retailer clicks, not full launch attribution. UTM links in this kit are identifiers, not a working analytics integration.
5. Run a small LinkedIn/X soft launch and permitted community feedback sessions. Record repeated friction before committing a larger launch day.
6. Launch on Product Hunt when the core journey is reliable; be available to answer comments. Post a separate technical Show HN when you can discuss the implementation.
7. Publish one useful Journal guide weekly; turn each into a short demonstration and one question. Publish a feedback-driven improvement after the first week.

## Measure interaction, not only visits

Proposed first cohort target (a planning target, not a forecast): 20 real testers, 10 detailed observations, and 3 recurring issues fixed.

Track referral source, lane opens, product opens, pairing opens/swaps, archive saves, retailer clicks and feedback submissions. Compare rates with clearly defined denominators, not raw channel totals. Use aggregate reports and avoid collecting message content or personal details in event payloads. Session return measurement needs a deliberate analytics/privacy choice.

Ask a tester to find a piece they would wear and one complementary item. Watch where they hesitate. Follow up with: “What was missing when you decided whether to buy?” Keep feedback in `feedback.csv`; assign an owner and a resolution.

## Actual readiness check

`live-check-2026-10-27.json` records HTTP checks before the local launch changes:

- Homepage, lanes and Jeans responded 200 and returned server-rendered metadata.
- Those three pages lacked `og:image`, `twitter:image` and canonical links.
- `/robots.txt` and `/sitemap.xml` returned 404.
- Repository inspection found no Tiptap/blog or launch attribution integration. Retailer click tracking already exists.

This is a targeted audit, not a complete production performance/security or browser test. The new code addresses Journal and sharing/indexing foundations. Attribution, guest feedback and a demo recording remain launch tasks.

## Files

- `platform-drafts.md`: separate Product Hunt, Show HN, LinkedIn, X, Reddit and directory copy.
- `demo-and-assets.md`: a demo storyboard and gallery brief.
- `journal-publishing.md`: how to add articles now and when Tiptap becomes worthwhile.
- `campaign-links.csv`: one campaign link per channel.
- `feedback.csv`: a blank observation tracker.

## Primary sources checked

- [Product Hunt launch guide](https://help.producthunt.com/en/articles/17350772-launch-guide): prepare the listing and maker comment, use a personal maker account, participate on launch day, and do not ask for upvotes. Tagline max60 characters; short description max260. Confirm limits in the submission UI.
- [Show HN guidelines](https://news.ycombinator.com/showhn.html): submit a working thing you made, make it easy to try, be around to discuss it; no requests for votes or comments from friends.
- [Reddit spam policy](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam): repeated or unsolicited mass engagement is prohibited. Read each community's rules too.
- [Rivelo Labs](https://www.rivelolabs.com/): identified as an app/website directory.
- [Tiptap React documentation](https://tiptap.dev/docs/editor/getting-started/install/react): an embeddable editor, with SSR configuration; it does not replace a publishing backend.
