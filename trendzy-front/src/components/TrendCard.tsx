import { useState } from "react";
import { m } from "framer-motion";
import { Stamp } from "@/components/Stamp";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { spring } from "@/motion/tokens";
import type { Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { discountPercent, formatPrice, laneLabel } from "@/lib/format";

export function trendImage(trend: Trend) {
  return trend.products?.underdog?.imageUrl || trend.products?.amazon?.imageUrl || trend.products?.flipkart?.imageUrl || "";
}

export function firstSentence(text: string, max = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const sentence = clean.match(/^[^.!?]+[.!?]/)?.[0] ?? clean;
  return sentence.length > max ? sentence.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : sentence;
}

/**
 * The editorial discovery card. Image first, then the brand, the trend and
 * one line of why. Hover lifts the card a few px, drifts the photo against
 * the pointer and nudges the stamp the other way for a sense of depth.
 * The whole card opens the story (shared-layout expansion, see TrendDetail).
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
  const [imageFailed, setImageFailed] = useState(false);
  const underdog = trend.products?.underdog;
  const image = trendImage(trend);
  const price = formatPrice(underdog?.price, underdog?.currency);
  const off = discountPercent(underdog?.price, underdog?.originalPrice);
  const lane = aesthetics.find((a) => a.id === trend.aestheticId || (a.id === "caps" && trend.aestheticId === "accessories"));
  const score = Math.round(trend.trendScore || 0);

  return (
    <m.article
      className="group/card relative flex h-full flex-col"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={spring.soft}
      data-cursor="explore"
      data-cursor-label="Open"
    >
      <PointerScope className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-paper ring-1 ring-border transition-shadow duration-500 group-hover/card:shadow-lift">
        {/* Media */}
        <m.div layoutId={`trend-media-${trend.id}`} className="relative aspect-[4/5] overflow-hidden bg-sand/40" transition={spring.layout}>
          {image && !imageFailed ? (
            <Parallax depth={3} bleed className="absolute inset-0">
              <img
                src={image}
                alt=""
                loading={priority ? "eager" : "lazy"}
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover/card:scale-[1.04]"
              />
            </Parallax>
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-cream">
              <span className="font-display text-3xl italic text-ink/25">{lane ? laneLabel(lane.name) : "TrendXee"}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-scrim/35 to-transparent" />
          <div className="absolute left-4 top-4 flex max-w-[70%] flex-wrap gap-1.5">
            {trend.subcategory && (
              <span className="truncate rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/75 backdrop-blur-sm">
                {trend.subcategory}
              </span>
            )}
            {off && (
              <span className="rounded-full bg-clay px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-paper">
                −{off}%
              </span>
            )}
          </div>
        </m.div>

        {/* Copy */}
        <div className="relative flex flex-1 flex-col p-5 pt-6">
          {score > 0 && (
            <div className="absolute -top-7 right-5 z-10">
              <Parallax depth={4} follow>
                <Stamp score={score} size="md" tone={trend.name.length % 2 === 0 ? "clay" : "olive"} className="shadow-print transition-transform duration-500 group-hover/card:-rotate-6" />
              </Parallax>
            </div>
          )}
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            {underdog?.brandName ? (
              <>
                <span className="text-clay">Underdog</span>
                <span className="truncate font-display text-[13px] normal-case italic tracking-normal text-ink/75">
                  {underdog.brandName}
                </span>
              </>
            ) : (
              <span>{lane ? laneLabel(lane.name) : "Trend"}</span>
            )}
          </p>
          <m.h3
            layoutId={`trend-title-${trend.id}`}
            transition={spring.layout}
            className="mt-2 line-clamp-2 font-display text-[1.45rem] leading-[1.12] tracking-[-0.01em]"
          >
            {trend.name}
          </m.h3>
          {trend.aiSummary && (
            <p className="mt-2.5 line-clamp-2 text-[14px] leading-relaxed text-ink/60">{firstSentence(trend.aiSummary)}</p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="flex items-baseline gap-2">
              {price ? (
                <>
                  <span className="font-display text-xl tabular-nums">{price}</span>
                  {off && (
                    <span className="text-[13px] text-ink/40 line-through">
                      {formatPrice(underdog?.originalPrice, underdog?.currency)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[13px] text-ink/50">See price at store</span>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-clay transition-all duration-300 md:translate-x-[-4px] md:opacity-0 md:group-hover/card:translate-x-0 md:group-hover/card:opacity-100">
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
          className="absolute inset-0 z-[5] rounded-[22px] focus-visible:outline-offset-[-4px]"
        />

        <div className="absolute right-3 top-3 z-20">
          <BookmarkButton trendId={trend.id} trendName={trend.name} knownArchived={archivedContext} onUnarchived={onUnarchived} />
        </div>
      </PointerScope>
    </m.article>
  );
}
