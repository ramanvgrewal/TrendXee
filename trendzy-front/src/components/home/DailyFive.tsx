import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, m, useAnimationFrame, useInView, useMotionValue, useReducedMotion, type MotionValue, type PanInfo } from "framer-motion";
import { Stamp } from "@/components/Stamp";
import { Img } from "@/components/Img";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { RevealHeading } from "@/motion/RevealHeading";
import { ease } from "@/motion/tokens";
import { aesthetics } from "@/lib/mock-data";
import type { RotationItem } from "@/lib/lanes";
import { discountPercent, formatPrice, laneLabel } from "@/lib/format";
import { businessApiFetch } from "@/lib/api";

const STORY_MS = 7000;

/**
 * 03 — The Daily Five: five underdog drops, one per page, like flipping a
 * small daily magazine. Directional page turns, swipe on touch, arrow keys,
 * a progress hairline per story, and it pauses on hover, focus and when the
 * tab is hidden. Reduced motion: no autoplay, crossfades only.
 */
export function DailyFive({ items }: { items: RotationItem[] }) {
  const reduced = useReducedMotion();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const elapsed = useMotionValue(0);
  const regionRef = useRef<HTMLElement>(null);
  const draggedRef = useRef(false);
  const count = items.length;
  const inView = useInView(regionRef, { amount: 0.35 });

  const go = useCallback(
    (dir: number) => {
      if (count < 2) return;
      elapsed.set(0);
      setPage(([i]) => [(i + dir + count) % count, dir]);
    },
    [count, elapsed],
  );
  const goTo = (target: number) => {
    if (target === index) return;
    elapsed.set(0);
    setPage([target, target > index ? 1 : -1]);
  };

  // Autoplay driven by one animation-frame clock (no intervals, no re-renders per tick).
  const autoplay = !reduced && !paused && inView && count > 1;
  useAnimationFrame((_, delta) => {
    if (!autoplay) return;
    const next = elapsed.get() + delta;
    if (next >= STORY_MS) go(1);
    else elapsed.set(next);
  });

  // Warm the next page's photo so turns never reveal an empty frame.
  useEffect(() => {
    const next = items[(index + 1) % Math.max(count, 1)];
    if (next?.image) new Image().src = next.image;
  }, [index, items, count]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (count === 0) return null;
  const item = items[index];
  const lane = aesthetics.find((a) => a.id === item.category);
  const price = formatPrice(item.price, item.currency);
  const was = discountPercent(item.price, item.originalPrice) ? formatPrice(item.originalPrice, item.currency) : null;

  // A swipe must never also count as a click on the shop link.
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (Math.abs(info.offset.x) > 6) draggedRef.current = true;
    if (swipe < -60) go(1);
    else if (swipe > 60) go(-1);
  };

  const track = () =>
    businessApiFetch("/api/analytics/click", {
      method: "POST",
      body: JSON.stringify({ trendId: item.id, source: "underdog", url: item.shopUrl }),
      keepalive: true,
    }).catch(() => {});

  return (
    <section
      ref={regionRef}
      id="daily-five"
      aria-roledescription="carousel"
      aria-label="The Daily Five"
      className="section-pad relative mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 sm:px-8"
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!regionRef.current?.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-ink/70">
            <span className="text-clay-ink">03</span> · Pinned today
          </p>
          <RevealHeading
            className="mt-3 font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.03em]"
            lines={[
              <>
                The Daily <em className="italic text-clay">Five</em>
              </>,
            ]}
          />
        </div>
        <p className="max-w-sm text-pretty text-[15px] leading-relaxed text-ink/70">
          Five underdog drops from across the lanes, reshuffled every midnight. Swipe, use the arrows, or let it turn.
        </p>
      </div>

      <div className="mt-12 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Visual */}
        <PointerScope className="relative lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-cream shadow-lift sm:aspect-[5/4]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <m.a
                key={item.id + index}
                href={item.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (draggedRef.current) {
                    e.preventDefault();
                    draggedRef.current = false;
                    return;
                  }
                  track();
                }}
                data-cursor="drag"
                data-cursor-label="Drag · Shop"
                aria-label={`Shop ${item.title} by ${item.brand}`}
                className="absolute inset-0 block touch-pan-y"
                custom={direction}
                variants={
                  reduced
                    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
                    : {
                        // Page turn: the next photo wipes in from the side you're heading to,
                        // settling from a slight zoom; the previous one recedes the other way.
                        enter: (dir: number) => ({
                          clipPath: dir >= 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
                          scale: 1.06,
                          zIndex: 2,
                        }),
                        center: { clipPath: "inset(0% 0% 0% 0%)", scale: 1, x: 0, opacity: 1, zIndex: 2 },
                        exit: (dir: number) => ({ x: dir >= 0 ? "-8%" : "8%", opacity: 0.35, zIndex: 1 }),
                      }
                }
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.7, ease: ease.drift }}
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={onDragEnd}
                draggable={false}
              >
                <Parallax depth={5} bleed className="absolute inset-0">
                  <Img src={item.image} draggable={false} eager className="h-full w-full select-none object-cover" />
                </Parallax>
              </m.a>
            </AnimatePresence>

            {/* Folio */}
            <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-raised/90 px-3 py-1.5 font-mono text-[12px] font-bold tracking-[0.12em] text-ink shadow-card backdrop-blur-sm">
              N° {String(index + 1).padStart(2, "0")} <span className="text-ink/70">/ {String(count).padStart(2, "0")}</span>
            </div>
          </div>

          {item.score > 0 && (
            <div className="absolute -right-3 -top-5 z-10 sm:-right-6 sm:-top-6">
              <Parallax depth={6} follow>
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.div
                    key={item.id + index}
                    initial={{ scale: 1.35, rotate: -14, opacity: 0 }}
                    animate={{ scale: 1, rotate: -6, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 24, delay: 0.25 }}
                  >
                    <Stamp score={item.score} size="lg" pressable className="shadow-print" />
                  </m.div>
                </AnimatePresence>
              </Parallax>
            </div>
          )}
        </PointerScope>

        {/* Story */}
        <div className="relative lg:col-span-5">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <m.div
              key={item.id + index}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 24 : -24 }),
                center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: ease.drift, staggerChildren: 0.05 } },
                exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -16 : 16, transition: { duration: 0.2 } }),
              }}
              aria-live={autoplay ? "off" : "polite"}
            >
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 eyebrow text-ink/70">
                {lane && (
                  <Link to="/aesthetic/$id" params={{ id: lane.id }} className="text-clay-ink transition-colors hover:text-ink">
                    {laneLabel(lane.name)}
                  </Link>
                )}
                {item.subcategory && (
                  <>
                    <span className="text-ink/25">/</span>
                    <span>{item.subcategory}</span>
                  </>
                )}
              </p>
              <h3 className="mt-4 font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.02] tracking-[-0.02em]">
                {item.trendName}
              </h3>
              {item.summary && <p className="mt-5 text-[16px] leading-relaxed text-ink/70">{item.summary}</p>}

              <div className="mt-8 flex items-end justify-between gap-6 border-t border-border pt-5">
                <div className="min-w-0">
                  <p className="eyebrow text-[11px] text-ink/70">The underdog</p>
                  <p className="mt-1 truncate font-display text-2xl italic">{item.brand || "Indie label"}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-ink/70">{item.title}</p>
                </div>
                {price && (
                  <div className="shrink-0 text-right">
                    {was && <p className="text-[13px] text-ink/70 line-through">{was}</p>}
                    <p className="font-display text-2xl tabular-nums">{price}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Cta magnetic>
                  <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" onClick={track} className={ctaClass("primary")}>
                    Shop the underdog <CtaArrow className="-rotate-45 group-hover/cta:translate-x-0.5" />
                  </a>
                </Cta>
                {lane && (
                  <Link
                    to="/aesthetic/$id"
                    params={{ id: lane.id }}
                    className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay"
                  >
                    More in {laneLabel(lane.name)}
                  </Link>
                )}
              </div>
            </m.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-12 flex items-center gap-5">
            <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Choose a story">
              {items.map((it, i) => (
                <button
                  key={it.id + i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Story ${i + 1}: ${it.trendName}`}
                  onClick={() => goTo(i)}
                  className="group/seg relative h-9 flex-1"
                >
                  <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-ink/12 transition-colors group-hover/seg:bg-ink/25">
                    {i < index && <span className="absolute inset-0 bg-ink/55" />}
                    {i === index && <ProgressFill elapsed={elapsed} reduced={!!reduced} />}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <PageButton label="Previous story" onClick={() => go(-1)} flip />
              <PageButton label="Next story" onClick={() => go(1)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressFill({ elapsed, reduced }: { elapsed: MotionValue<number>; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced) return;
    return elapsed.on("change", (v) => {
      if (ref.current) ref.current.style.transform = `scaleX(${v / STORY_MS})`;
    });
  }, [elapsed, reduced]);
  return (
    <span
      ref={ref}
      className="absolute inset-0 origin-left bg-clay"
      style={{ transform: reduced ? "scaleX(1)" : `scaleX(${elapsed.get() / STORY_MS})` }}
    />
  );
}

function PageButton({ label, onClick, flip = false }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <Cta magnetic>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="grid size-12 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
      >
        <svg viewBox="0 0 20 20" className={`size-4 ${flip ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3.5 10h12.5M11.5 5l5 5-5 5" />
        </svg>
      </button>
    </Cta>
  );
}
