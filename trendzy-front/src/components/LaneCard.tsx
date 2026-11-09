import { Link } from "@tanstack/react-router";
import { AnimatePresence, m, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/motion/hooks";
import type { RotationItem } from "@/lib/lanes";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { lift, spring } from "@/motion/tokens";
import type { Aesthetic } from "@/lib/mock-data";
import { laneLabel, isShoeCategory, productImageFit } from "@/lib/format";
import { Img } from "@/components/Img";
import { useAudience } from "@/components/AudienceFilter";

const SLIDE_INTERVAL = 5_000;
const controlClass = "grid size-10 place-items-center rounded-full text-on-scrim hover:bg-scrim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-scrim";

type LaneCardProps = {
  aesthetic: Aesthetic;
  index: number;
  products?: RotationItem[];
  className?: string;
  eager?: boolean;
};

export function LaneCard({ products, ...props }: LaneCardProps) {
  const slides = products?.slice(0, 5) ?? [];
  const key = JSON.stringify(slides.map(({ id, image }) => [id, image]));
  return <LaneCardSlideshow key={key} slides={slides} {...props} />;
}

function LaneCardSlideshow({
  aesthetic,
  index,
  slides,
  className = "",
  eager = false,
}: Omit<LaneCardProps, "products"> & { slides: RotationItem[] }) {
  const audience = useAudience();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const { length } = slides;
  const slide = slides[current];
  const brand = slide?.brand;
  const label = laneLabel(aesthetic.name);
  const src = slide?.image || (audience === "ALL" ? aesthetic.heroImage : "");

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (length < 2 || !inView || !visible || reduced || paused || hovered || focused) return;
    const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % length), SLIDE_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [current, focused, hovered, inView, length, paused, reduced, visible]);

  const step = (direction: number) => {
    setCurrent((value) => (value + direction + length) % length);
  };

  return (
    <m.div
      ref={ref}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className={`group/lane relative min-h-[26rem] ${className}`}
      whileHover={lift.card}
      whileTap={lift.press}
      transition={spring.soft}
    >
      <Link
        to="/aesthetic/$id"
        params={{ id: aesthetic.id }}
        viewTransition
        data-cursor="explore"
        data-cursor-label="Enter"
        className="block h-full rounded-[20px] outline-offset-4"
      >
        <PointerScope className="relative h-full overflow-hidden rounded-[20px] bg-cream shadow-print transition-shadow duration-[350ms] group-hover/lane:shadow-lift group-active/lane:shadow-press">
          {/* Photo */}
          <div className="absolute inset-0" style={{ viewTransitionName: `lane-${aesthetic.id}` }}>
            <Parallax depth={isShoeCategory(aesthetic.id) ? 0 : 5} bleed={!isShoeCategory(aesthetic.id)} className="absolute inset-0">
              <AnimatePresence initial={false}>
                <m.div
                  key={src}
                  className="absolute inset-0"
                  initial={{ opacity: reduced ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.5 }}
                >
                  {src ? <Img
                    src={src}
                    alt={slide?.title || label + " fashion"}
                    eager={eager || current > 0}
                    fallbackLabel={label}
                    className={`h-full w-full ${productImageFit(aesthetic.id)} ${isShoeCategory(aesthetic.id) ? "" : "group-hover/lane:scale-[1.03]"}`}
                  /> : <div className="h-full w-full bg-ink" />}
                </m.div>
              </AnimatePresence>
            </Parallax>
          </div>
          {/* Shade only where type sits (bottom copy, top-left numeral) so the photo stays clean. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/55 via-35% to-transparent to-65%" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_0%_0%,color-mix(in_oklab,var(--scrim)_50%,transparent),transparent)]" />

          {/* Index numeral */}
          <span aria-hidden className="pointer-events-none absolute -left-1 -top-4 font-display text-[7.5rem] leading-none tracking-[-0.06em] text-on-scrim/40 transition-colors duration-500 group-hover/lane:text-on-scrim/60 sm:text-[9rem]">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Copy */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-on-scrim sm:p-7">
            <Parallax depth={1.5} follow>
              <h3 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] [overflow-wrap:anywhere]">{laneLabel(aesthetic.name)}</h3>
              <p className="mt-3 line-clamp-2 max-w-[22rem] text-[14px] leading-relaxed text-on-scrim/75">{aesthetic.description}</p>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-on-scrim/20 pt-4 eyebrow">
                <span className="truncate text-on-scrim/75">
                  {brand ? (
                    <>
                      Featured: <span className="font-display text-[13px] normal-case italic tracking-normal text-on-scrim">{brand}</span>
                    </>
                  ) : (
                    audience === "ALL" ? aesthetic.vibeTags.slice(0, 3).join(" · ") : "New finds soon"
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-on-scrim transition-transform duration-300 group-hover/lane:translate-x-0.5">
                  Enter
                  <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M3.5 10h12.5M11.5 5l5 5-5 5" />
                  </svg>
                </span>
              </div>
            </Parallax>
          </div>
        </PointerScope>
      </Link>
      {length > 1 && (
        <div role="group" aria-label={label + " featured products"} className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-scrim/75 p-1 text-on-scrim">
          <button type="button" className={controlClass} aria-label="Previous featured product" onClick={() => step(-1)}>
            <ChevronLeft size={17} aria-hidden />
          </button>
          <span className="min-w-[2.25rem] text-center text-xs tabular-nums">
            {current + 1}/{length}
          </span>
          <button type="button" className={controlClass} aria-label="Next featured product" onClick={() => step(1)}>
            <ChevronRight size={17} aria-hidden />
          </button>
          {!reduced && (
            <button type="button" className={controlClass} aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused((value) => !value)}>
              {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </button>
          )}
        </div>
      )}
    </m.div>
  );
}
