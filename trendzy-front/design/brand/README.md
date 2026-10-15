# TrendXee — woven X

Two gently curved bands form the X in TrendXee. A clear cut at the crossing
suggests an over-and-under textile weave. The ascending band remains continuous,
giving the mark a quiet sense of movement. Flat terminals keep the silhouette
clear at small sizes. The existing Lora wordmark completes the lockup.

- Master: `public/brand/trendxee-mark.svg` (transparent, terracotta `#B96947`).
- Transparent export: `public/brand/trendxee-mark.png` (512 × 512).
- Browser icon: `public/favicon.svg` (espresso `#2B211B` on cream `#F1EBDE`).
- Fallbacks: `public/favicon.ico` (16/32/48) and `public/favicon-32.png`.
- Home screen: `public/apple-touch-icon.png` (180 × 180, opaque).

Use the master SVG for web placement. It includes its own clear space; do not
crop to the paths, add outlines, distort, or rotate the mark. The navigation uses
32 × 32 pixels. Keep the accompanying wordmark as live text.

To regenerate derived assets after editing the master, run
`node scripts/export-brand-assets.mjs` with `sharp` available, or set
`SHARP_MODULE` to an existing installation's module path. This is a design-time
export only; there are no additional application dependencies.
