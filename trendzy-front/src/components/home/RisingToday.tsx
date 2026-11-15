import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Stamp } from "@/components/Stamp";
import { Img } from "@/components/Img";
import { TrendDetail } from "@/components/TrendDetail";
import { ScrollReveal } from "@/motion/ScrollReveal";
import { aesthetics, type Trend } from "@/lib/mock-data";
import type { RotationItem } from "@/lib/lanes";
import { getTrend } from "@/lib/api";
import { discountPercent, formatPrice, isShoeCategory, laneLabel, productImageFit } from "@/lib/format";

/**
 * Products straight under the cover: a top-scored drop from each lane, so a
 * first-time visitor sees what TrendXee has before any storytelling. Two per
 * row on phones, four on wide screens. Opening one shows its story in place.
 */
export function RisingToday({ items }: { items: RotationItem[] }) {
  const [openTrend, setOpenTrend] = useState<Trend | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  if (items.length < 4) return null;

  const open = async (item: RotationItem) => {
    if (opening) return;
    request.current?.abort();
    const current = new AbortController();
    request.current = current;
    setOpening(item.id);
    try {
      const trend = await getTrend(item.id, current.signal);
      if (!current.signal.aborted) setOpenTrend(trend);
    } catch {
      if (!current.signal.aborted) toast.error("This drop couldn't be opened. Please try again.");
    } finally {
      if (!current.signal.aborted) setOpening(null);
    }
  };

  return (
    <section id="rising" aria-labelledby="rising-heading" className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-[clamp(3.5rem,7vw,6rem)] pt-[clamp(2.5rem,5vw,4.5rem)] sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="eyebrow flex items-center gap-2 text-ink/70">
            <span className="inline-block size-1.5 rounded-full bg-clay" /> On the board now
          </p>
          <h2 id="rising-heading" className="mt-3 font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-none tracking-[-0.025em]">
            Rising <em className="italic text-clay">today</em>
          </h2>
        </div>
        <p className="lede max-w-sm">A top-scoring drop from every lane right now. Open one to see the brand, the proof and where to buy.</p>
      </div>

      <ul className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-10 sm:gap-x-6 sm:gap-y-10 md:grid-cols-4">
        {items.map((item, i) => {
          const lane = aesthetics.find((a) => a.id === item.category);
          const price = formatPrice(item.price, item.currency);
          const off = discountPercent(item.price, item.originalPrice);
          const busy = opening === item.id;
          const shoe = isShoeCategory(item.category);
          return (
            <ScrollReveal as="li" key={item.id} index={i} y={20} className="group/rise relative min-w-0">
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream shadow-card transition-shadow duration-[350ms] group-hover/rise:shadow-lift sm:rounded-[20px]">
                  <Img
                    src={item.image}
                    alt={`${item.title} by ${item.brand || "an indie label"}`}
                    fallbackLabel={item.brand}
                    className={`h-full w-full ${productImageFit(item.category)} ${shoe ? "" : "group-hover/rise:scale-[1.03]"}`}
                  />
                  {off && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-stamp-clay px-2 py-0.5 text-[11px] font-bold text-paper sm:left-3.5 sm:top-3.5">−{off}%</span>
                  )}
                  {busy && <span role="status" className="absolute inset-0 grid place-items-center bg-paper/60 text-[13px] font-semibold text-ink">Opening…</span>}
                </div>
                {item.score > 0 && (
                  <div className="pointer-events-none absolute -bottom-4 right-2.5 sm:right-4">
                    <Stamp score={item.score} size="md" tone={i % 2 ? "olive" : "clay"} className="shadow-print max-sm:size-9 max-sm:text-[15px]" />
                  </div>
                )}
              </div>

              <div className="pt-3 sm:pt-4">
                <p className="truncate pr-12 font-display text-[14px] italic text-ink/75 sm:text-[15px]">{item.brand || "Indie label"}</p>
                <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-[1.25] tracking-[-0.01em] sm:text-[1.2rem] sm:leading-[1.2]">
                  {/* The stretched button makes the whole card open the story. */}
                  <button
                    type="button"
                    disabled={!!opening}
                    aria-busy={busy}
                    onClick={() => void open(item)}
                    data-cursor="explore"
                    data-cursor-label="Open"
                    className="text-left transition-colors after:absolute after:inset-0 after:rounded-[20px] group-hover/rise:text-clay disabled:cursor-wait"
                  >
                    {item.title || item.trendName}
                  </button>
                </h3>
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[13px]">
                  {price ? <span className="font-display text-base tabular-nums sm:text-lg">{price}</span> : <span className="text-ink/60">Price at the store</span>}
                  {lane && (
                    <Link to="/aesthetic/$id" params={{ id: lane.id }} className="relative z-10 text-ink/60 underline decoration-ink/20 underline-offset-4 hover:text-clay">
                      {laneLabel(lane.name)}
                    </Link>
                  )}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </ul>

      <TrendDetail trend={openTrend} onClose={() => setOpenTrend(null)} />
    </section>
  );
}
