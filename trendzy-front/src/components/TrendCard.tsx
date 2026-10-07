import { m } from "framer-motion";
import { Stamp } from "@/components/Stamp";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Img } from "@/components/Img";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { spring } from "@/motion/tokens";
import type { Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { discountPercent, formatPrice, laneLabel } from "@/lib/format";

export function trendImage(trend: Trend) {
  return trend.products?.underdog?.imageUrl || trend.products?.amazon?.imageUrl || trend.products?.flipkart?.imageUrl || "";
}

export function trendLane(trend: Trend) {
  return aesthetics.find((a) => a.id === trend.aestheticId || (a.id === "caps" && trend.aestheticId === "accessories"));
}

export function firstSentence(text: string, max = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const sentence = clean.match(/^[^.!?]+[.!?]/)?.[0] ?? clean;
  return sentence.length > max ? sentence.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : sentence;
}

/**
 * The editorial discovery card — a physical object:
 * rest: quiet raised paper · hover: lifts 4px, photo drifts and scales to 1.03,
 * "Open story" appears · press: settles to 0.98 · release: springs back.
 *
 * Its surface, photo and title carry shared layout ids, so opening it
 * expands this very card into the story view (see TrendDetail).
 */
export function TrendCard({
  trend,
  onOpen,
  archivedContext = false,
  onUnarchived,
  priority = false,
}: {
  trend: Trend;
  onOpen: (trend: Trend) => void;
  archivedContext?: boolean;
  onUnarchived?: () => void;
  priority?: boolean;
}) {
  const underdog = trend.products?.underdog;
  const image = trendImage(trend);
  const price = formatPrice(underdog?.price, underdog?.currency);
  const off = discountPercent(underdog?.price, underdog?.originalPrice);
  const lane = trendLane(trend);
  const score = Math.round(trend.trendScore || 0);

  return (
    <m.article
      className="group/card relative h-full"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98, y: -1 }}
      tabIndex={-1}
      transition={spring.soft}
      data-cursor="explore"
      data-cursor-label="Open"
    >
      {/* The paper surface (morphs into the story's background). */}
      <m.div
        layoutId={`trend-surface-${trend.id}`}
        transition={spring.layout}
        className="absolute inset-0 bg-raised shadow-card transition-shadow duration-500 group-hover/card:shadow-lift group-active/card:shadow-press"
        style={{ borderRadius: 20 }}
      />

      <PointerScope className="relative flex h-full flex-col overflow-hidden rounded-[20px]">
        {/* Photo */}
        <m.div
          layoutId={`trend-media-${trend.id}`}
          transition={spring.layout}
          className="relative aspect-[4/5] overflow-hidden bg-cream"
          style={{ borderRadius: 0 }}
        >
          <Parallax depth={3} bleed className="absolute inset-0">
            <Img
              src={image}
              eager={priority}
              fallbackLabel={lane ? laneLabel(lane.name) : "TrendXee"}
              className="h-full w-full object-cover group-hover/card:scale-[1.03]"
            />
          </Parallax>
          {/* Only a light top veil, so the chips stay legible on bright photos. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-scrim/30 to-transparent" />
          {off && (
            <span className="absolute left-4 top-4 rounded-full bg-stamp-clay px-2.5 py-1 text-[11px] font-bold text-paper">
              −{off}%
            </span>
          )}
        </m.div>

        {/* Copy */}
        <div className="relative flex flex-1 flex-col p-5 pt-6">
          {score > 0 && (
            <div className="absolute -top-7 right-5 z-10">
              <Parallax depth={4} follow>
                <Stamp
                  score={score}
                  size="md"
                  tone={trend.name.length % 2 === 0 ? "clay" : "olive"}
                  className="shadow-print transition-transform duration-500 group-hover/card:-rotate-6"
                />
              </Parallax>
            </div>
          )}

          <p className="flex min-w-0 items-baseline gap-2 pr-14">
            {underdog?.brandName ? (
              <>
                <span className="eyebrow shrink-0 text-[11px] text-clay-ink">Underdog</span>
                <span className="truncate font-display text-[15px] italic text-ink/80">{underdog.brandName}</span>
              </>
            ) : (
              <span className="eyebrow text-[11px] text-ink/70">{lane ? laneLabel(lane.name) : "Trend"}</span>
            )}
          </p>

          <m.h3
            layoutId={`trend-title-${trend.id}`}
            transition={spring.layout}
            className="mt-2 line-clamp-2 text-balance font-display text-[1.4rem] leading-[1.15] tracking-[-0.01em]"
          >
            {trend.name}
          </m.h3>

          {trend.aiSummary && (
            <p className="mt-2.5 line-clamp-2 text-pretty text-[14.5px] leading-relaxed text-ink/70">{firstSentence(trend.aiSummary)}</p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="flex items-baseline gap-2">
              {price ? (
                <>
                  <span className="font-display text-xl tabular-nums">{price}</span>
                  {off && (
                    <span className="text-[13px] text-ink/70 line-through">{formatPrice(underdog?.originalPrice, underdog?.currency)}</span>
                  )}
                </>
              ) : (
                <span className="meta">Price at the store</span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-clay-ink transition-all duration-300 md:-translate-x-1 md:opacity-0 md:group-hover/card:translate-x-0 md:group-hover/card:opacity-100 md:group-focus-within/card:translate-x-0 md:group-focus-within/card:opacity-100">
              Open story
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M3.5 10h12.5M11.5 5l5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>

        {/* Whole-card hit area (keeps the bookmark a separate, valid button) */}
        <button
          type="button"
          onClick={() => onOpen(trend)}
          aria-label={`Open the story: ${trend.name}`}
          className="absolute inset-0 z-[5] rounded-[20px] focus-visible:outline-offset-[-4px]"
        />

        <div className="absolute right-3 top-3 z-20">
          <BookmarkButton trendId={trend.id} trendName={trend.name} knownArchived={archivedContext} onUnarchived={onUnarchived} />
        </div>
      </PointerScope>
    </m.article>
  );
}
