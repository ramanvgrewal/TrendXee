import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, m } from "framer-motion";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { Magnetic } from "@/motion/Magnetic";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { ScrollTextReveal } from "@/motion/ScrollTextReveal";
import { aesthetics } from "@/lib/mock-data";
import type { RotationItem } from "@/lib/lanes";
import { laneLabel } from "@/lib/format";

/**
 * 07 — The close: one line revealed by scrolling, then the lanes as the way in.
 * On desktop, pointing at a lane brings its cover up in the print on the right
 * (the same covers the lane cards already loaded, so no new requests).
 */
export function FinalCta({ rotationMap }: { rotationMap: Record<string, RotationItem[]> }) {
  const [active, setActive] = useState(aesthetics[0].id);
  const lane = aesthetics.find((a) => a.id === active) ?? aesthetics[0];
  const index = aesthetics.indexOf(lane);
  const cover = rotationMap[lane.id]?.[0]?.image || lane.heroImage;

  return (
    <section className="relative overflow-hidden">
      <div className="section-pad mx-auto grid w-full max-w-[1440px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <p className="eyebrow text-ink/70">
            <span className="text-clay-ink">07</span> · Start somewhere
          </p>
          <ScrollTextReveal
            as="h2"
            text="Find the fit before everyone else does."
            dim={0.14}
            offset={["start 95%", "end 75%"]}
            className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,6vw,6.25rem)] leading-[0.95] tracking-[-0.035em]"
          />

          <div className="mt-14 flex flex-wrap gap-3 lg:gap-2.5">
            {aesthetics.map((a) => (
              <Magnetic key={a.id} max={5}>
                <Link
                  to="/aesthetic/$id"
                  params={{ id: a.id }}
                  onPointerEnter={() => setActive(a.id)}
                  onFocus={() => setActive(a.id)}
                  data-active={a.id === active || undefined}
                  className="inline-flex h-11 items-center rounded-full bg-raised/60 px-5 text-sm lg:px-4 font-semibold shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink)_16%,transparent)] transition-colors hover:bg-ink hover:text-paper hover:shadow-none lg:data-[active]:shadow-[inset_0_0_0_1px_var(--clay)]"
                >
                  {laneLabel(a.name)}
                </Link>
              </Magnetic>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Cta magnetic>
              <Link to="/lanes" className={ctaClass("primary", "lg")}>
                Browse every lane <CtaArrow />
              </Link>
            </Cta>
            <Link to="/about" className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay">
              Why we built TrendXee
            </Link>
          </div>
        </div>

        <PointerScope className="hidden lg:col-span-5 lg:block xl:col-span-4 xl:pr-6">
          <Parallax depth={3}>
            <Link
              to="/aesthetic/$id"
              params={{ id: lane.id }}
              data-cursor="view"
              data-cursor-label="Open"
              tabIndex={-1}
              aria-hidden
              className="group block rotate-[1.5deg] rounded-[28px] bg-cream p-2.5 shadow-lift ring-1 ring-border transition-transform duration-700 hover:rotate-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sand/50">
                <AnimatePresence initial={false}>
                  <m.img
                    key={lane.id}
                    src={cover}
                    alt=""
                    loading="lazy"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-scrim/75 via-scrim/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-on-scrim">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-on-scrim/75">
                      Lane {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 truncate font-display text-2xl italic">{laneLabel(lane.name)}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-scrim/80 transition-colors group-hover:text-on-scrim">
                    Open →
                  </span>
                </div>
              </div>
            </Link>
          </Parallax>
        </PointerScope>
      </div>
    </section>
  );
}
