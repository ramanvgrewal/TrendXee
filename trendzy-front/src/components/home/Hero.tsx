import { useRef, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { m, useScroll, useTransform } from "framer-motion";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { Stamp } from "@/components/Stamp";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { useMotionAllowed } from "@/motion/hooks";
import { aesthetics } from "@/lib/mock-data";
import type { RotationItem } from "@/lib/lanes";
import { indiaDateLabel, laneLabel } from "@/lib/format";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * 01 — Hero. An asymmetrical editorial cover: oversized Lora headline on the
 * left, a layered "pinned print" of today's lead underdog on the right.
 *
 * Entrance is CSS (plays from server HTML, ~900ms total): image unclips →
 * headline lines rise → copy → CTA → metadata.
 * Scroll (MotionValues): the print sinks and scales gently while the headline
 * lifts away faster, so the cover peels off into the story below.
 * Pointer (desktop): three depths of parallax — print, small prints, stamp.
 */
export function Hero({ lead, prints }: { lead?: RotationItem; prints: RotationItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const allowed = useMotionAllowed();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const printY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const printScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const smallY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const smallY2 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const leadImage = lead?.image ?? aesthetics[0].heroImage;
  const [printA, printB] = prints;

  return (
    <PointerScope mode="viewport" className="relative isolate overflow-hidden">
      <section ref={ref} className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1440px] grid-cols-1 gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pb-20 lg:pt-20">
        {/* Copy */}
        <m.div
          className="relative z-10 flex flex-col justify-center lg:col-span-7 lg:pr-6"
          style={allowed ? { y: copyY, opacity: copyOpacity } : undefined}
        >
          <div className="enter-fade flex items-center gap-3 eyebrow text-ink/70" style={d(620)}>
            <span className="inline-block size-1.5 rounded-full bg-clay" />
            The daily board <span className="text-ink/30">/</span> {indiaDateLabel()}
          </div>

          <Parallax depth={1.5} follow>
            <h1 className="mt-7 font-display text-[clamp(3.25rem,8.4vw,8.5rem)] font-normal leading-[0.9] tracking-[-0.035em]">
              <span className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                <span className="enter-line block" style={d(120)}>
                  Fits before
                </span>
              </span>
              <span className="-mb-[0.16em] block overflow-hidden pb-[0.18em]">
                <span className="enter-line block" style={d(220)}>
                  they <em className="font-normal italic text-clay">go viral.</em>
                </span>
              </span>
            </h1>
          </Parallax>

          <p className="enter-fade mt-8 max-w-[33rem] text-[16px] leading-[1.75] text-ink/70 sm:text-[17px]" style={d(420)}>
            TrendXee puts emerging indie clothing brands to the ultimate test - auditing their hype and trust signals to verify and back only the labels that actually deliver.
          </p>

          <div className="enter-fade mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" style={d(520)}>
            <Cta magnetic>
              <a
                href="#lanes"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("lanes")?.scrollIntoView({ behavior: allowed ? "smooth" : "auto" });
                }}
                className={ctaClass("primary", "lg")}
              >
                Explore the lanes <CtaArrow />
              </a>
            </Cta>
            <Link
              to="/"
              hash="engine"
              className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay"
            >
              How the engine works
            </Link>
          </div>
        </m.div>

        {/* Pinned prints */}
        <div className="relative lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[480px] lg:ml-auto lg:mr-0">
            {/* Small print, top-left, behind */}
            {printA && (
              <m.div
                className="absolute -left-[19%] bottom-[7%] z-0 hidden w-[24%] xl:block"
                style={allowed ? { y: smallY } : undefined}
              >
                <Parallax depth={6}>
                  <div className="enter-print overflow-hidden rounded-xl bg-cream p-1.5 shadow-print ring-1 ring-border" style={d(520)}>
                    <img src={printA.image} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover" />
                  </div>
                </Parallax>
              </m.div>
            )}

            {/* Lead print */}
            <m.div className="relative z-10" style={allowed ? { y: printY, scale: printScale } : undefined}>
              <Parallax depth={3}>
                <a
                  href={lead?.shopUrl || "#lanes"}
                  target={lead ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  data-cursor="view"
                  className="group block"
                >
                  <div className="relative rounded-[28px] bg-cream p-2.5 shadow-lift ring-1 ring-border">
                    <div className="enter-clip relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sand/50">
                      <Parallax depth={4} bleed className="absolute inset-0">
                        <img
                          src={leadImage}
                          alt={lead ? `${lead.title} by ${lead.brand}` : "Today's lead drop"}
                          fetchPriority="high"
                          className="media-zoom h-full w-full object-cover group-hover:scale-[1.03]"
                        />
                      </Parallax>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-scrim/75 via-scrim/25 to-transparent" />
                      {lead && (
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-on-scrim">
                          <div className="min-w-0">
                            <p className="eyebrow text-[11px] text-on-scrim/70">
                              Today's underdog
                            </p>
                            <p className="mt-1 truncate font-display text-xl italic">{lead.brand}</p>
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-scrim/80 transition-colors group-hover:text-on-scrim">
                            Shop ↗
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </Parallax>

              {lead && lead.score > 0 && (
                <div className="absolute -left-1 -top-6 z-20 sm:-left-7 sm:-top-7">
                  <Parallax depth={7} follow>
                    <div className="enter-print" style={d(700)}>
                      <Stamp score={lead.score} size="lg" className="shadow-print" />
                    </div>
                  </Parallax>
                </div>
              )}
            </m.div>

            {/* Small print, bottom-right, in front */}
            {printB && (
              <m.div
                className="absolute -bottom-10 right-4 z-20 hidden w-[30%] sm:block lg:hidden"
                style={allowed ? { y: smallY2 } : undefined}
              >
                <Parallax depth={8}>
                  <div className="enter-print overflow-hidden rounded-xl bg-cream p-1.5 shadow-lift ring-1 ring-border" style={d(640)}>
                    <img src={printB.image} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                  </div>
                </Parallax>
              </m.div>
            )}
          </div>
        </div>

        {/* Lane index + scroll cue along the bottom edge */}
        <div className="enter-fade relative z-10 flex items-end justify-between gap-6 border-t border-border pt-5 lg:col-span-12" style={d(760)}>
          <nav aria-label="Lanes" className="no-scrollbar -mx-5 flex gap-x-6 overflow-x-auto px-5 eyebrow sm:mx-0 sm:flex-wrap sm:px-0">
            {aesthetics.map((a, i) => (
              <Link
                key={a.id}
                to="/aesthetic/$id"
                params={{ id: a.id }}
                className="group/lane shrink-0 py-3 text-ink/70 transition-colors hover:text-ink"
              >
                <span className="mr-1.5 font-mono text-[10px] text-clay-ink">{String(i + 1).padStart(2, "0")}</span>
                {laneLabel(a.name)}
              </Link>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-3 eyebrow text-[11px] text-ink/70 md:flex">
            Scroll
            <span className="relative block h-10 w-px overflow-hidden bg-ink/10">
              <span className="scroll-cue absolute inset-0 bg-clay" />
            </span>
          </div>
        </div>
      </section>
    </PointerScope>
  );
}

