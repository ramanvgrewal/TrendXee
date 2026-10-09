import { useEffect, useRef, useState, type CSSProperties } from "react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { LaneCard } from "@/components/LaneCard";
import { RevealHeading } from "@/motion/RevealHeading";
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
      <div className={pinned ? "sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-16" : "py-6"}>
        <div className={`mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 sm:px-8 ${pinned ? "" : "pt-20"}`}>
          <div>
            <p className="eyebrow text-ink/70">
              <span className="text-clay-ink">04</span> · The lanes
            </p>
            <RevealHeading
              className="mt-4 h-section"
              lines={[
                "Eight lanes.",
                <em key="w" className="italic text-clay">
                  Pick a world.
                </em>,
              ]}
            />
          </div>
          <div className="flex items-center gap-5">
            {pinned && (
              <div className="flex items-center gap-3 font-mono text-[12px] font-bold tracking-[0.14em] text-ink/70">
                <m.span className="text-ink">{counter}</m.span>
                <span className="relative block h-px w-28 overflow-hidden bg-ink/15">
                  <m.span className="absolute inset-0 origin-left bg-clay" style={{ scaleX: bar }} />
                </span>
                08
              </div>
            )}
            <Link
              to="/lanes"
              className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay"
            >
              All lanes
            </Link>
          </div>
        </div>

        <m.div
          ref={trackRef}
          className={`no-scrollbar mt-8 flex gap-5 px-5 sm:px-8 ${
            pinned ? "w-max gap-6" : "snap-x snap-mandatory scroll-px-5 overflow-x-auto pb-6 sm:scroll-px-8"
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
                className="h-[min(68svh,560px)] w-[78vw] shrink-0 snap-start sm:w-[min(46vw,400px)] lg:h-[min(54svh,560px)] lg:w-[min(30vw,420px)]"
              />
            );
          })}
          {pinned && <div aria-hidden className="w-[10vw] shrink-0" />}
        </m.div>
      </div>
    </section>
  );
}
