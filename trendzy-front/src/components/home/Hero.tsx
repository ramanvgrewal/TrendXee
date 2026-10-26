import { useRef, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { m, useScroll, useTransform } from "framer-motion";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { Stamp } from "@/components/Stamp";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { useFinePointer, useMotionAllowed } from "@/motion/hooks";
import { aesthetics } from "@/lib/mock-data";
import type { RotationItem } from "@/lib/lanes";
import { indiaDateLabel, laneLabel, isShoeCategory, productImageFit } from "@/lib/format";
import { trackProductClick } from "@/lib/useTrendActions";
import { Img } from "@/components/Img";
import { useAudience } from "@/components/AudienceFilter";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/**
 * 01 — Hero. An asymmetrical editorial cover: oversized Lora headline on the
 * left, a portrait print of today's lead underdog on the right.
 *
 * Entrance is CSS (plays from server HTML, ~900ms total): image unclips →
 * headline lines rise → copy → CTA → metadata.
 * Scroll (MotionValues): the print sinks and scales gently while the headline
 * lifts away faster, so the cover peels off into the story below.
 * Pointer (desktop): the print and stamp move at different depths.
 */
export function Hero({ lead, dateKey }: { lead?: RotationItem; dateKey: string }) {
  const audience = useAudience();
  const ref = useRef<HTMLElement>(null);
  const motionAllowed = useMotionAllowed();
  const finePointer = useFinePointer();
  const allowed = motionAllowed && finePointer;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const printY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const printScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  const leadImage = lead?.image ?? (audience === "ALL" ? aesthetics[0].heroImage : "");

  return (
    <PointerScope mode="viewport" className="relative isolate overflow-hidden">
      <section ref={ref} data-board-date={dateKey} data-board-lead={lead?.id} className="home-cover relative mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-9 px-5 pb-8 pt-7 sm:px-8 sm:pt-10 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:grid-rows-[1fr_auto] lg:gap-x-10 lg:gap-y-12 lg:pb-8 lg:pt-12 xl:gap-x-12 xl:pt-14">
        {/* Copy */}
        <m.div
          className="relative z-10 flex min-w-0 flex-col justify-center lg:pr-4"
          style={allowed ? { y: copyY, opacity: copyOpacity } : undefined}
        >
          <div className="enter-fade flex flex-wrap items-center gap-x-2 gap-y-1 eyebrow text-[10px] text-ink/70 sm:gap-3 sm:text-[11.5px]" style={d(620)}>
            <span className="inline-block size-1.5 rounded-full bg-clay" />
            The daily board <span className="text-ink/30">/</span> {indiaDateLabel(new Date(`${dateKey}T12:00:00+05:30`))}
          </div>

          <Parallax depth={1.5} follow>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,12.8vw,4.5rem)] font-normal leading-[0.94] tracking-[-0.035em] sm:mt-7 lg:mt-8 lg:text-[clamp(4rem,8.4vw,8.5rem)] lg:leading-[0.9]">
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

          <p className="enter-fade mt-5 max-w-[36rem] text-[16px] leading-[1.75] text-ink/70 sm:mt-7 sm:text-[17px] lg:mt-8 lg:text-[18px]" style={d(420)}>
            TrendXee puts emerging indie clothing brands in focus, bringing together Instagram hype, trust signals and product details to help you discover the labels behind your next fit.
          </p>

          <div className="enter-fade mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-8 lg:mt-10" style={d(520)}>
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
              className="inline-flex min-h-11 items-center text-sm font-semibold text-ink/75 underline decoration-ink/25 underline-offset-4 hover:text-clay"
            >
              How the engine works
            </Link>
          </div>
        </m.div>

        {/* Lead portrait */}
        <div className="relative min-w-0 self-center">
          <div className="home-cover-print relative mx-auto w-full max-w-[420px] lg:ml-auto lg:mr-0 lg:max-w-none">
            {/* Lead print */}
            <m.div className="relative z-10" style={allowed ? { y: printY, scale: printScale } : undefined}>
              <Parallax depth={3}>
                <a
                  href={lead?.shopUrl || "#lanes"}
                  target={lead ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  data-cursor="view"
                  onClick={() => {
                    if (lead?.id && lead?.shopUrl) {
                      trackProductClick(lead.id, "underdog", lead.shopUrl);
                    }
                  }}
                  className="group block"
                >
                  <div className="relative rounded-[28px] bg-cream p-2.5 shadow-lift ring-1 ring-border">
                    <div className="enter-clip relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sand/50">
                      <Parallax depth={isShoeCategory(lead?.category) ? 0 : 4} bleed={!isShoeCategory(lead?.category)} className="absolute inset-0">
                        {leadImage ? <Img
                          src={leadImage}
                          alt={lead ? `${lead.title} by ${lead.brand}` : "Explore indie fashion"}
                          priority
                          fallbackLabel={lead?.brand || "Explore indie fashion"}
                          className={`h-full w-full ${productImageFit(lead?.category)} ${isShoeCategory(lead?.category) ? "" : "media-zoom group-hover:scale-[1.03]"}`}
                        /> : <div className="flex h-full flex-col items-center justify-center gap-5 bg-ink px-8 text-center text-on-scrim">
                          <img src="/brand/trendxee-mark.svg" alt="" className="size-16" />
                          <p className="font-display text-3xl italic">Your next find is on its way.</p>
                          <p className="text-sm text-on-scrim/70">No drops for this filter yet. Explore every fit with All.</p>
                        </div>}
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
          </div>
        </div>

        {/* Lane index + scroll cue along the bottom edge */}
        <div className="enter-fade relative z-10 flex min-w-0 items-end justify-between gap-6 border-t border-border pt-3 lg:col-span-2" style={d(760)}>
          <nav aria-label="Lanes" className="no-scrollbar -mx-5 flex min-w-0 flex-1 flex-nowrap gap-x-5 overflow-x-auto overscroll-x-contain whitespace-nowrap px-5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] sm:mx-0 sm:px-0 xl:gap-x-6">
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

