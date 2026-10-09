import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { RevealHeading } from "@/motion/RevealHeading";
import type { RotationItem } from "@/lib/lanes";
import { formatPrice } from "@/lib/format";

/**
 * 05 — The underdog story. One real drop from today's board, shown the way
 * TrendXee thinks about it: the small label that made it first, and the
 * mainstream lookalike beside it. The two prints slide in from opposite
 * sides as the section scrolls into place, then hold still.
 */
export function UnderdogStory({ item }: { item?: RotationItem }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const leftX = useTransform(scrollYProgress, [0, 1], ["-8%", "0%"]);
  const rightX = useTransform(scrollYProgress, [0, 1], ["10%", "0%"]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  if (!item?.mainstream) return null;
  const ms = item.mainstream;
  const underdogPrice = formatPrice(item.price, item.currency);
  const mainstreamPrice = formatPrice(ms.price, ms.currency);
  const source = ms.source === "amazon" ? "Amazon" : "Flipkart";
  // Marketplace listings sometimes echo the indie label's name; never credit the lookalike to the underdog.
  const sameBrand = !ms.brand || ms.brand.trim().toLowerCase() === item.brand.trim().toLowerCase();
  const msLabel = sameBrand ? `On ${source}` : ms.brand;

  return (
    <section ref={ref} className="tone-invert relative mx-3 overflow-hidden rounded-[28px] py-20 shadow-[0_40px_80px_-48px_oklch(0.25_0.03_45/0.55)] sm:mx-5 lg:mx-8 lg:py-32">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <p className="eyebrow text-ink/70">
            <span className="text-clay-ink">05</span> · Underdogs first
          </p>
          <RevealHeading
            className="mt-4 h-section"
            lines={[
              "Small labels",
              <>
                make it <em className="italic text-clay">first.</em>
              </>,
            ]}
          />
          <p className="lede mt-6 max-w-md">
            The big names usually copy a fit after it takes off. Every drop on TrendXee leads with the
            indie brand behind it — then shows the mainstream lookalike, so the choice is yours.
          </p>
          <p className="mt-8 eyebrow text-ink/70">Today's example</p>
          <p className="mt-2 text-balance font-display text-2xl leading-snug">{item.trendName}</p>
        </div>

        <PointerScope className="relative grid grid-cols-2 gap-4 sm:gap-6 lg:col-span-8 lg:pl-8">
          <m.figure style={reduced ? undefined : { x: leftX }} className="relative">
            <Parallax depth={4}>
              <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" data-cursor="view" data-cursor-label="Shop" className="group block">
                <m.div
                  className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-sand/50 shadow-lift"
                  style={reduced ? undefined : { scale: cardScale }}
                >
                  <img src={item.image} alt={item.title} loading="lazy" className="media-zoom h-full w-full object-cover group-hover:scale-[1.03]" />
                  <span className="absolute left-4 top-4 rounded-full bg-stamp-clay px-3 py-1 eyebrow text-[11px] text-paper">
                    <span className="max-sm:hidden">The </span>underdog
                  </span>
                </m.div>
                <figcaption className="mt-4 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <span className="truncate font-display text-lg italic sm:text-xl">{item.brand}</span>
                  {underdogPrice && <span className="shrink-0 font-display text-lg tabular-nums">{underdogPrice}</span>}
                </figcaption>
              </a>
            </Parallax>
          </m.figure>

          <m.figure style={reduced ? undefined : { x: rightX }} className="relative mt-16 sm:mt-24">
            <Parallax depth={2}>
              <a href={ms.shopUrl} target="_blank" rel="noopener noreferrer" data-cursor="view" data-cursor-label="Compare" className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-sand/40 opacity-90 ring-1 ring-border transition-opacity duration-500 group-hover:opacity-100">
                  <img src={ms.image} alt={ms.title} loading="lazy" className="media-zoom h-full w-full object-cover grayscale-[35%] group-hover:scale-[1.03] group-hover:grayscale-0" />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 eyebrow text-[11px] text-ink/70">
                    <span className="max-sm:hidden">The lookalike · </span>
                    {source}
                  </span>
                </div>
                <figcaption className="mt-4 flex flex-col gap-0.5 text-ink/70 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <span className="truncate text-sm font-semibold">{msLabel}</span>
                  {mainstreamPrice && <span className="shrink-0 text-sm tabular-nums">{mainstreamPrice}</span>}
                </figcaption>
              </a>
            </Parallax>
          </m.figure>
        </PointerScope>
      </div>
    </section>
  );
}
