import { useEffect, useRef, useState, type CSSProperties } from "react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { LaneCard } from "@/components/LaneCard";
import { useMediaQuery } from "@/motion/hooks";
import { follow } from "@/motion/tokens";
import { aesthetics } from "@/lib/mock-data";
import type { RotationMap } from "@/lib/lanes";

/**
 * 04 — The lane universe. On desktop this is the site's one horizontal
 * moment: the section pins and vertical scrolling slides the eight lanes
 * across the stage, then normal scrolling resumes. On phones (and with
 * reduced motion) it is a native swipeable rail — nothing hijacked.
 */
export function LaneUniverse({ rotationMap }: { rotationMap: RotationMap }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const pinned = desktop && !reduced;
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const track = trackRef.current;
      if (track) setDistance(Math.max(0, track.scrollWidth - window.innerWidth + 64));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, follow.scroll);
  const x = useTransform(smooth, [0.04, 0.96], [0, -distance]);
  const counter = useTransform(smooth, (v) => String(Math.min(8, Math.max(1, Math.round(v * 7) + 1))).padStart(2, "0"));
  const bar = useTransform(smooth, [0.04, 0.96], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="lanes"
      className="relative scroll-mt-16"
      style={pinned ? ({ height: `calc(100svh + ${distance}px)` } as CSSProperties) : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden" : "py-6"}>
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 pt-20 sm:px-8 lg:pt-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/50">
              <span className="text-clay">04</span> · The lanes
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.03em]">
              Eight lanes. <em className="italic text-clay">Pick a world.</em>
            </h2>
          </div>
          <div className="flex items-center gap-5">
            {pinned && (
              <div className="flex items-center gap-3 font-mono text-[12px] font-bold tracking-[0.14em] text-ink/55">
                <m.span className="text-ink">{counter}</m.span>
                <span className="relative block h-px w-28 overflow-hidden bg-ink/15">
                  <m.span className="absolute inset-0 origin-left bg-clay" style={{ scaleX: bar }} />
                </span>
                08
              </div>
            )}
            <Link
              to="/lanes"
              className="text-sm font-semibold text-ink/65 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-clay hover:decoration-clay"
            >
              All lanes
            </Link>
          </div>
        </div>

        <m.div
          ref={trackRef}
          className={`no-scrollbar mt-10 flex gap-5 px-5 sm:px-8 ${
            pinned ? "w-max gap-6" : "snap-x snap-mandatory overflow-x-auto pb-6"
          }`}
          style={pinned ? { x } : undefined}
        >
          {aesthetics.map((aesthetic, i) => {
            const first = rotationMap[aesthetic.id]?.[0];
            return (
              <LaneCard
                key={aesthetic.id}
                aesthetic={aesthetic}
                index={i}
                image={first?.image}
                brand={first?.brand}
                className="h-[min(68svh,560px)] w-[78vw] shrink-0 snap-start sm:w-[min(46vw,400px)] lg:h-[min(62svh,600px)] lg:w-[min(31vw,440px)]"
              />
            );
          })}
          {pinned && <div aria-hidden className="w-[10vw] shrink-0" />}
        </m.div>
      </div>
    </section>
  );
}
