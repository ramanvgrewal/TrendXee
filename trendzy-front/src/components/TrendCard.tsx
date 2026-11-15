import { m } from "framer-motion";
import { Stamp } from "@/components/Stamp";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Img } from "@/components/Img";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { lift, spring } from "@/motion/tokens";
import type { Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { discountPercent, formatPrice, laneLabel, isShoeCategory, productImageFit } from "@/lib/format";
import { TrustBadge } from "./TrustBadge";
import { audienceLabel } from "@/lib/audience";
import { belongsToLane } from "@/lib/lanes";

export function trendImage(trend: Trend) {
  return trend.products?.underdog?.imageUrl || "";
}

export function trendLane(trend: Trend) {
  return aesthetics.find((a) => belongsToLane(trend, a.id));
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
  activeLayout = false,
}: {
  trend: Trend;
  onOpen: (trend: Trend) => void;
  archivedContext?: boolean;
  onUnarchived?: () => void;
  priority?: boolean;
  activeLayout?: boolean;
}) {
  const underdog = trend.products?.underdog;
  const image = trendImage(trend);
  const price = formatPrice(underdog?.price, underdog?.currency);
  const off = discountPercent(underdog?.price, underdog?.originalPrice);
  const lane = trendLane(trend);
  const score = Math.round(trend.trendScore || 0);

  return (
    <m.article
      className="group/card relative h-full min-w-0"
      whileHover={lift.card}
      whileTap={lift.press}
      tabIndex={-1}
      transition={spring.soft}
      data-cursor="explore"
      data-cursor-label="Open"
    >
      {/* The paper surface (morphs into the story's background). */}
      <m.div
        layoutId={activeLayout ? `trend-surface-${trend.id}` : undefined}
        transition={spring.layout}
        className="fibre absolute inset-0 bg-raised shadow-card transition-shadow duration-[350ms] group-hover/card:shadow-lift group-active/card:shadow-press"
        style={{ borderRadius: 20 }}
      />

      <PointerScope className="relative flex h-full flex-col overflow-hidden rounded-[20px]">
        {/* Photo */}
        <m.div
          layoutId={activeLayout ? `trend-media-${trend.id}` : undefined}
          transition={spring.layout}
          className="relative aspect-[4/5] overflow-hidden bg-cream"
          style={{ borderRadius: 0 }}
        >
          <Parallax depth={isShoeCategory(trend.aestheticId) ? 0 : 3} bleed={!isShoeCategory(trend.aestheticId)} className="absolute inset-0">
            <Img
              src={image}
              alt={trend.products.underdog?.title || trend.name}
              eager={priority}
              fallbackLabel={lane ? laneLabel(lane.name) : "TrendXee"}
              className={`h-full w-full ${productImageFit(trend.aestheticId)} ${isShoeCategory(trend.aestheticId) ? "" : "group-hover/card:scale-[1.03]"}`}
            />
          </Parallax>
          {/* Only a light top veil, so the chips stay legible on bright photos. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-scrim/25 to-transparent" />
          {off && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-stamp-clay px-2 py-0.5 text-[11px] font-bold text-paper sm:left-4 sm:top-4 sm:px-2.5 sm:py-1">
              −{off}%
            </span>
          )}
        </m.div>

        {/* Copy */}
        {/* Phones show two cards per row: brand, title, price and score only. */}
        <div className="relative flex flex-1 flex-col p-3 pt-4 sm:p-5 sm:pt-6">
          {score > 0 && (
            <div className="absolute -top-5 right-2.5 z-10 sm:-top-7 sm:right-5">
              <Parallax depth={4} follow>
                <Stamp
                  score={score}
                  size="md"
                  tone={trend.name.length % 2 === 0 ? "clay" : "olive"}
                  className="shadow-print transition-transform duration-500 group-hover/card:-rotate-6 max-sm:size-9 max-sm:text-[15px]"
                />
              </Parallax>
            </div>
          )}

          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:flex-nowrap sm:pr-14">
            {underdog?.brandName ? (
              <>
                <span className="eyebrow shrink-0 text-[11px] text-clay-ink max-sm:hidden">Underdog</span>
                <span className="flex min-w-0 basis-full flex-wrap items-center gap-x-2 gap-y-1 font-display text-[14px] italic text-ink/80 sm:basis-auto sm:text-[15px]">
                  <span className="max-w-full truncate">{underdog.brandName}</span>
                  <TrustBadge ratingAverage={trend.userRatingAverage} ratingCount={trend.userRatingCount} signals={trend.ratingSignals} />
                </span>
              </>
            ) : (
              <span className="eyebrow text-[11px] text-ink/70">{lane ? laneLabel(lane.name) : "Trend"}</span>
            )}
          </p>

          <m.h3
            layoutId={activeLayout ? `trend-title-${trend.id}` : undefined}
            transition={spring.layout}
            className="mt-1.5 line-clamp-2 font-display text-[15px] leading-[1.25] tracking-[-0.01em] sm:mt-2 sm:text-balance sm:text-[1.4rem] sm:leading-[1.15]"
          >
            {trend.name}
          </m.h3>

          {audienceLabel(underdog?.audience) && <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60 max-sm:hidden">{audienceLabel(underdog?.audience)}</p>}

          {trend.aiSummary && (
            <p className="mt-2.5 line-clamp-2 text-pretty text-[14.5px] leading-relaxed text-ink/70 max-sm:hidden">{firstSentence(trend.aiSummary)}</p>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3 sm:pt-5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              {price ? (
                <>
                  <span className="font-display text-base tabular-nums sm:text-xl">{price}</span>
                  {off && (
                    <span className="text-[13px] text-ink/70 line-through">{formatPrice(underdog?.originalPrice, underdog?.currency)}</span>
                  )}
                </>
              ) : (
                <span className="meta">Price at the store</span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-clay-ink transition-all duration-300 max-sm:hidden md:-translate-x-1 md:opacity-0 md:group-hover/card:translate-x-0 md:group-hover/card:opacity-100 md:group-focus-within/card:translate-x-0 md:group-focus-within/card:opacity-100">
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

        <div className="absolute right-1.5 top-1.5 z-20 sm:right-3 sm:top-3">
          <BookmarkButton trendId={trend.id} trendName={trend.name} knownArchived={archivedContext} onUnarchived={onUnarchived} />
        </div>
      </PointerScope>
    </m.article>
  );
}
