import { useRef } from "react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { RevealHeading } from "@/motion/RevealHeading";
import { follow } from "@/motion/tokens";

const STEPS = [
  {
    title: "Listen",
    body: "We watch what people actually post, search and repost across social feeds, marketplaces and indie brand stores.",
  },
  {
    title: "Cluster",
    body: "Related chatter is grouped into one drop — a single fit idea with the reasons it is climbing right now.",
  },
  {
    title: "Score",
    body: "Each drop gets a trend score from signal volume, velocity and how shoppable it currently is.",
  },
  {
    title: "Source",
    body: "We pin the underdog brand making it first, then the mainstream lookalikes, so you can choose either.",
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
    <section ref={ref} id="engine" className="section-pad mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow text-ink/70">
            <span className="text-clay-ink">06</span> · How the engine works
          </p>
          <RevealHeading
            className="mt-4 font-display text-[clamp(2.4rem,4.6vw,4.25rem)] leading-[0.98] tracking-[-0.03em]"
            lines={[
              "Noise in,",
              <>
                <em className="italic text-clay">one honest drop</em> out.
              </>,
            ]}
          />
        </div>
        <p className="self-end text-[16px] leading-relaxed text-ink/70 lg:col-span-4 lg:col-start-9">
          Every drop on the board went through the same four steps. Scores move as the chatter moves.
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
