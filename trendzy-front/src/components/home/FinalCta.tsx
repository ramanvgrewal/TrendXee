import { Link } from "@tanstack/react-router";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { Magnetic } from "@/motion/Magnetic";
import { ScrollTextReveal } from "@/motion/ScrollTextReveal";
import { aesthetics } from "@/lib/mock-data";
import { laneLabel } from "@/lib/format";

/** 07 — The close: one line revealed by scrolling, then the lanes as the way in. */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="section-pad mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <p className="eyebrow text-ink/70">
          <span className="text-clay-ink">07</span> · Start somewhere
        </p>
        <ScrollTextReveal
          as="h2"
          text="Find the fit before everyone else does."
          dim={0.14}
          offset={["start 95%", "end 75%"]}
          className="mt-6 max-w-5xl font-display text-[clamp(2.8rem,7vw,7rem)] leading-[0.95] tracking-[-0.035em]"
        />

        <div className="mt-14 flex flex-wrap gap-3">
          {aesthetics.map((a) => (
            <Magnetic key={a.id} max={5}>
              <Link
                to="/aesthetic/$id"
                params={{ id: a.id }}
                className="inline-flex h-11 items-center rounded-full bg-raised/60 px-5 text-sm font-semibold shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink)_16%,transparent)] transition-colors hover:bg-ink hover:text-paper hover:shadow-none"
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
    </section>
  );
}
