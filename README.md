# Instagram assets (@trendxeeindia)

Not part of the app. Used by the daily posting task.

- `make_slides.py SPEC.json OUT_DIR`: renders `cover.jpg` and `end.jpg` (1080x1350, TrendXee colours, Lora + Inter).
  Spec keys: kicker, title, sub, end_title, end_lines (list), end_cta.
- `YYYY-MM-DD/`: slides, spec and Metricool payload for each post.
- `log.csv`: every post made, so products and formats are not repeated.
- `make_reel.py SPEC.json OUT_DIR`: renders a silent 1080x1920 reel (hook flashes, one card per product with brand/name/price, outro) and `timeline.json` for the voiceover. Spec: hook (lines), hook_sub, outro_title (lines), outro_lines, seconds_per_product, products [{brand,name,price,orig,images[]}].
- `reels/YYYY-MM-DD/`: reel spec, script/caption and timeline (videos themselves live on Raman's laptop in Desktop\tx\marketing\reels).
