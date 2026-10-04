import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { ScrollReveal } from "@/motion/ScrollReveal";
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
  const clip = useTransform(scrollYProgress, [0, 1], ["inset(14% 8% 14% 8% round 24px)", "inset(0% 0% 0% 0% round 24px)"]);

  if (!item?.mainstream) return null;
  const ms = item.mainstream;
  const underdogPrice = formatPrice(item.price, item.currency);
  const mainstreamPrice = formatPrice(ms.price, ms.currency);
  const source = ms.source === "amazon" ? "Amazon" : "Flipkart";

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream/60 py-24 lg:py-36">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
        <ScrollReveal className="lg:col-span-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/50">
            <span className="text-clay">05</span> · Underdogs first
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,4.25rem)] leading-[0.98] tracking-[-0.03em]">
            Small labels make it <em className="italic text-clay">first.</em>
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink/70">
            The big names usually copy a fit after it takes off. Every drop on TrendXee leads with the
            indie brand behind it — then shows the mainstream lookalike, so the choice is yours.
          </p>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">Today's example</p>
          <p className="mt-2 font-display text-2xl leading-snug">{item.trendName}</p>
        </ScrollReveal>

        <PointerScope className="relative grid grid-cols-2 gap-4 sm:gap-6 lg:col-span-8 lg:pl-8">
          <m.figure style={reduced ? undefined : { x: leftX }} className="relative">
            <Parallax depth={4}>
              <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" data-cursor="view" data-cursor-label="Shop" className="group block">
                <m.div
                  className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand/50 shadow-lift"
                  style={reduced ? undefined : { clipPath: clip }}
                >
                  <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]" />
                  <span className="absolute left-4 top-4 rounded-full bg-clay px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-paper">
                    The underdog
                  </span>
                </m.div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="truncate font-display text-xl italic">{item.brand}</span>
                  {underdogPrice && <span className="shrink-0 font-display text-lg tabular-nums">{underdogPrice}</span>}
                </figcaption>
              </a>
            </Parallax>
          </m.figure>

          <m.figure style={reduced ? undefined : { x: rightX }} className="relative mt-16 sm:mt-24">
            <Parallax depth={2}>
              <a href={ms.shopUrl} target="_blank" rel="noopener noreferrer" data-cursor="view" data-cursor-label="Compare" className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand/40 opacity-90 ring-1 ring-border transition-opacity duration-500 group-hover:opacity-100">
                  <img src={ms.image} alt={ms.title} loading="lazy" className="h-full w-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0" />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
                    The lookalike · {source}
                  </span>
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-3 text-ink/65">
                  <span className="truncate text-sm font-semibold">{ms.brand || source}</span>
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
