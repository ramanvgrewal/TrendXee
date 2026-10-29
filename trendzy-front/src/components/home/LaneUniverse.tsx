import { usePrefersReducedMotion as useReducedMotion } from "@/motion/hooks";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LaneCard } from "@/components/LaneCard";
import { RevealHeading } from "@/motion/RevealHeading";
import { aesthetics } from "@/lib/mock-data";
import type { RotationMap } from "@/lib/lanes";

/**
 * One native horizontal rail at every viewport and browser zoom level.
 * Vertical scrolling always continues through the page.
 */
export function LaneUniverse({ rotationMap }: { rotationMap: RotationMap }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [bounds, setBounds] = useState({ previous: false, next: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      setBounds({
        previous: track.scrollLeft > 2,
        next: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    for (const card of track.children) ro.observe(card);
    track.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      track.removeEventListener("scroll", measure);
    };
  }, []);

  const move = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const step = (card?.getBoundingClientRect().width ?? track.clientWidth * .8)
      + (Number.parseFloat(getComputedStyle(track).columnGap) || 0);
    track.scrollBy({ left: direction * step, behavior: reduced ? "instant" : "smooth" });
  };

  return (
    <section
      id="lanes"
      className="relative scroll-mt-[7.5rem]"
    >
      <div className="py-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-end justify-between gap-6 px-5 pt-20 sm:px-8">
          <div>
            <p className="eyebrow text-ink/70">
              <span className="text-clay-ink">04</span> · The lanes
            </p>
            <RevealHeading
              className="mt-4 h-section"
              lines={[
                "Nine lanes.",
                <em key="w" className="italic text-clay">
                  Pick a world.
                </em>,
              ]}
            />
          </div>
          <div className="flex items-center gap-5">
            <div className="flex gap-2" aria-label="Lane navigation">
              <button type="button" aria-label="Previous lane" aria-controls="lane-universe-rail"
                disabled={!bounds.previous} onClick={() => move(-1)}
                className="hit flex items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink/5 disabled:cursor-default disabled:opacity-30">
                <ArrowLeft size={18} aria-hidden />
              </button>
              <button type="button" aria-label="Next lane" aria-controls="lane-universe-rail"
                disabled={!bounds.next} onClick={() => move(1)}
                className="hit flex items-center justify-center rounded-full border border-ink/20 text-ink transition-colors hover:bg-ink/5 disabled:cursor-default disabled:opacity-30">
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
            <Link
              to="/lanes"
              className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay"
            >
              All lanes
            </Link>
          </div>
        </div>

        <div
          ref={trackRef}
          id="lane-universe-rail"
          aria-label="Fashion lanes"
          tabIndex={0}
          className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-6 sm:scroll-px-8 sm:px-8"
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
        </div>
      </div>
    </section>
  );
}
