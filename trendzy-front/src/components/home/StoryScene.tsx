import { m, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ScrollScene } from "@/motion/ScrollScene";
import { ScrollTextReveal } from "@/motion/ScrollTextReveal";
import { Parallax, PointerScope } from "@/motion/Parallax";
import type { RotationItem } from "@/lib/lanes";

/**
 * 02 — The pinned story. The stage holds still while scrolling plays a short
 * film about what TrendXee does, using real products from today's board:
 *
 *   the feed drifts past       → "The internet moves fast. Trends move faster."
 *   the copy clears            → "So we watch what people actually post."
 *   everything else dims       → "We filter the noise into one honest drop."
 *   one product steps forward  → "And we find the underdogs."
 *
 * Products sit in the outer columns only, so the type in the centre is
 * always on clean paper.
 */

type Slot = {
  left: string;
  top: string;
  width: string;
  /** Total vertical drift across the scene, px (negative = up). */
  drift: number;
  depth: number;
  mobile?: boolean;
  /** Phone position (only for `mobile` slots): top/bottom bands, clear of the copy. */
  mLeft?: string;
  mTop?: string;
  aspect?: string;
};

const SLOTS: Slot[] = [
  { left: "4%", top: "14%", width: "clamp(104px,12vw,190px)", drift: -260, depth: 3, mobile: true, mLeft: "6%", mTop: "10%" },
  { left: "13%", top: "54%", width: "clamp(90px,9vw,150px)", drift: -420, depth: 5, aspect: "1/1" },
  { left: "2%", top: "80%", width: "clamp(100px,10vw,160px)", drift: -340, depth: 2 },
  { left: "77%", top: "8%", width: "clamp(96px,10vw,165px)", drift: -380, depth: 4, mobile: true, mLeft: "66%", mTop: "13%" },
  { left: "76%", top: "58%", width: "clamp(112px,14vw,220px)", drift: -200, depth: 3, mobile: true, mLeft: "calc(50% - 56px)", mTop: "76%" }, // ← the underdog
  { left: "90%", top: "38%", width: "clamp(80px,8vw,130px)", drift: -480, depth: 6, aspect: "1/1" },
  { left: "86%", top: "86%", width: "clamp(84px,9vw,140px)", drift: -300, depth: 2, mobile: true, mLeft: "7%", mTop: "84%" },
];
const CHOSEN = 4;

export function StoryScene({ items }: { items: RotationItem[] }) {
  const reduced = useReducedMotion();
  const products = items.slice(0, SLOTS.length);

  if (reduced) return <StaticStory chosen={products[CHOSEN]} />;

  return (
    <ScrollScene length={4.2} mobileLength={3.2} id="story">
      {(progress) => <Stage progress={progress} products={products} />}
    </ScrollScene>
  );
}

function Stage({ progress, products }: { progress: MotionValue<number>; products: RotationItem[] }) {
  // Act one exits, act two enters.
  const actOneOpacity = useTransform(progress, [0.3, 0.37], [1, 0]);
  const actOneY = useTransform(progress, [0.3, 0.37], [0, -50]);
  const actTwoOpacity = useTransform(progress, [0.35, 0.4, 0.92, 0.99], [0, 1, 1, 0]);
  const actTwoY = useTransform(progress, [0.92, 0.99], [0, -40]);

  // Chapter marker.
  const chapter = useTransform<number, string>(progress, (v) => (v < 0.37 ? "i" : v < 0.66 ? "ii" : "iii"));
  const rail = useTransform(progress, [0, 1], [0, 1]);

  return (
    <PointerScope mode="viewport" className="relative h-full w-full">
      {/* The feed */}
      {products.map((item, i) => (
        <FeedPrint key={`${item.id}-${i}`} item={item} slot={SLOTS[i]} chosen={i === CHOSEN} progress={progress} />
      ))}

      {/* A low lamp behind the copy, so the dark chapter has a source of light. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_42%_at_50%_50%,color-mix(in_oklab,var(--clay)_8%,transparent),transparent_72%)]"
      />

      {/* Copy, centred on clean paper */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center px-6">
        <div className="relative w-full max-w-[min(52rem,54vw)] text-center max-md:max-w-full">
          <m.div style={{ opacity: actOneOpacity, y: actOneY }} className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <ScrollTextReveal
              as="p"
              progress={progress}
              range={[0.02, 0.14]}
              dim={0.14}
              text="The internet moves fast."
              className="text-balance font-display text-[clamp(2.4rem,6.2vw,6.25rem)] leading-[0.98] tracking-[-0.03em]"
            />
            <ScrollTextReveal
              as="p"
              progress={progress}
              range={[0.14, 0.27]}
              by="char"
              dim={0.14}
              text="Trends move faster."
              className="mt-2 text-balance font-display text-[clamp(2.4rem,6.2vw,6.25rem)] italic leading-[0.98] tracking-[-0.03em] text-clay"
            />
          </m.div>

          <m.div style={{ opacity: actTwoOpacity, y: actTwoY }} className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <ScrollTextReveal
              as="p"
              progress={progress}
              range={[0.4, 0.5]}
              text="So we watch what people actually post."
              className="text-balance font-display text-[clamp(1.9rem,4.4vw,4.4rem)] leading-[1.04] tracking-[-0.025em]"
            />
            <ScrollTextReveal
              as="p"
              progress={progress}
              range={[0.52, 0.64]}
              text="We filter the noise into one honest drop."
              className="mt-3 text-balance font-display text-[clamp(1.9rem,4.4vw,4.4rem)] leading-[1.04] tracking-[-0.025em] text-ink/70"
            />
            <ScrollTextReveal
              as="p"
              progress={progress}
              range={[0.68, 0.84]}
              by="char"
              text="And we find the underdogs."
              className="mt-6 text-balance font-display text-[clamp(2.2rem,5.4vw,5.5rem)] italic leading-[1] tracking-[-0.03em] text-clay"
            />
          </m.div>
        </div>
      </div>

      {/* Chapter rail */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 eyebrow text-[11px] text-ink/70">
        <span className="max-sm:hidden">How TrendXee reads the feed</span>
        <span className="relative block h-px w-24 overflow-hidden bg-ink/15">
          <m.span className="absolute inset-0 origin-left bg-clay" style={{ scaleX: rail }} />
        </span>
        <m.span className="w-5 font-display text-sm normal-case italic tracking-normal text-clay">{chapter}</m.span>
      </div>
    </PointerScope>
  );
}

function FeedPrint({
  item,
  slot,
  chosen,
  progress,
}: {
  item: RotationItem;
  slot: Slot;
  chosen: boolean;
  progress: MotionValue<number>;
}) {
  const y = useTransform(progress, [0, 1], [120, 120 + slot.drift]);
  // Everyone arrives; at "filter" the crowd dims; the underdog stays and steps forward.
  // Present from the moment the scene arrives (never an empty stage), dims at
  // "filter", and clears at the very end as the scene hands over.
  const opacity = useTransform(
    progress,
    chosen ? [0, 0.92, 1] : [0, 0.52, 0.62, 0.92, 1],
    chosen ? [1, 1, 0] : [0.95, 0.95, 0.12, 0.12, 0],
  );
  const scale = useTransform(progress, chosen ? [0.62, 0.8] : [0, 1], chosen ? [1, 1.18] : [1, 1]);
  const ring = useTransform(progress, [0.66, 0.78], [0, 1]);

  return (
    <m.div
      className={`absolute left-[var(--ml)] top-[var(--mt)] md:left-[var(--l)] md:top-[var(--t)] ${slot.mobile ? "" : "max-md:hidden"}`}
      style={
        {
          "--l": slot.left,
          "--t": slot.top,
          "--ml": slot.mLeft ?? slot.left,
          "--mt": slot.mTop ?? slot.top,
          width: slot.width,
          y,
          opacity,
          scale,
        } as never
      }
    >
      <Parallax depth={slot.depth}>
        <div className="relative rounded-xl bg-cream p-1.5 shadow-print ring-1 ring-border">
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="w-full rounded-lg object-cover"
            style={{ aspectRatio: slot.aspect ?? "4/5" }}
          />
          {chosen && (
            <>
              <m.span
                aria-hidden
                className="pointer-events-none absolute -inset-1.5 rounded-[16px] ring-2 ring-clay"
                style={{ opacity: ring }}
              />
              <m.p
                className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap md:left-0 md:translate-x-0 eyebrow text-[11px] text-clay-ink"
                style={{ opacity: ring }}
              >
                The underdog · <span className="font-display text-xs normal-case italic tracking-normal">{item.brand}</span>
              </m.p>
            </>
          )}
        </div>
      </Parallax>
    </m.div>
  );
}

function StaticStory({ chosen }: { chosen?: RotationItem }) {
  return (
    <section id="story" className="mx-auto max-w-4xl px-5 py-28 text-center sm:px-8">
      <p className="text-balance font-display text-[clamp(2.2rem,5vw,4.5rem)] leading-tight tracking-tight">
        The internet moves fast. <em className="text-clay">Trends move faster.</em>
      </p>
      <p className="mt-8 font-display text-[clamp(1.6rem,3.4vw,3rem)] leading-snug text-ink/70">
        So we watch what people actually post, and filter the noise into one honest drop.
      </p>
      <p className="mt-8 font-display text-[clamp(2rem,4.5vw,4rem)] italic text-clay">And we find the underdogs.</p>
      {chosen && (
        <p className="mt-6 eyebrow text-ink/70">Today: {chosen.brand}</p>
      )}
    </section>
  );
}
