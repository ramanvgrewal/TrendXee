import { usePrefersReducedMotion as useReducedMotion } from "@/motion/hooks";
import { useRef } from "react";
import { m, useScroll, useSpring, useTransform } from "framer-motion";
import { RevealHeading } from "@/motion/RevealHeading";
import { follow } from "@/motion/tokens";

const STEPS = [
  {
    title: "Discover",
    body: "We track rising fashion drops across indie storefronts and creators, cutting through marketplace clutter to find who made each fit first.",
  },
  {
    title: "Audit",
    body: "Every underdog brand is vetted for genuine trust signals — verifying Cash on Delivery readiness, verified reviews, and fulfillment reliability.",
  },
  {
    title: "Hype Score",
    body: "We measure true momentum (0–100) from the label's Instagram footprint — analyzing authentic follower growth, real engagement, and posting cadence.",
  },
  {
    title: "Back",
    body: "The community rates and reviews the brand, helping shoppers back authentic underdogs while comparing them with mainstream lookalikes.",
  },
];

/**
 * 06 — The engine. A deliberately calm section: a single hairline draws
 * itself across the four steps as you scroll, and each step settles in once.
 */
export function EngineSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const line = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), follow.scroll);

  return (
    <section ref={ref} id="engine" className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-[clamp(3rem,5vw,4.5rem)] pt-[clamp(5rem,9vw,8.5rem)] sm:px-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow text-ink/70">
            <span className="text-clay-ink">06</span> · How the engine works
          </p>
          <RevealHeading
            className="mt-4 h-section"
            lines={[
              "Audited for trust,",
              <>
                <em className="italic text-clay">backed by real hype</em>.
              </>,
            ]}
          />
        </div>
        <p className="lede self-end lg:col-span-4 lg:col-start-9">
          Every label on the board goes through the same proving ground — audited for trust, scored for hype, and backed by the community.
        </p>
      </div>

      <div className="relative mt-16">
        {/* The drawn line */}
        <div aria-hidden className="absolute left-0 right-0 top-[1.15rem] hidden h-px bg-ink/10 md:block">
          <m.div className="h-full origin-left bg-clay" style={{ scaleX: reduced ? 1 : line }} />
        </div>
        <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="relative z-10 inline-grid size-9 place-items-center rounded-full bg-paper font-display text-sm italic text-clay shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--clay)_45%,transparent)]">
                {i + 1}
              </span>
              <h3 className="mt-6 font-display text-3xl tracking-tight">{step.title}</h3>
              <p className="mt-3 max-w-xs text-pretty text-[15px] leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
