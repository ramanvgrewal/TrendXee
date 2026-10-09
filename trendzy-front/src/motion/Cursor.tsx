import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useSpring, useTransform, useVelocity } from "framer-motion";
import { usePointer } from "@/motion/pointer";
import { follow, spring } from "@/motion/tokens";

/**
 * The TrendXee pointer: a drop of ink on warm paper.
 *
 *   core  — a 6px ink point that sits almost on the real pointer;
 *   aura  — a soft clay glow that glides a beat behind and stretches a little
 *           in the direction of travel, like wet ink;
 *   ring  — a hairline that only appears over links and buttons;
 *   label — a small caption beside the point on products and destinations.
 *
 * Over buttons the cursor leans a few px toward the button's centre (the
 * button leans back via <Magnetic>), so the two meet like physical objects.
 *
 * States are read from the DOM, not wired per component:
 *   - `data-cursor="view" | "explore" | "drag" | "none"` on any element,
 *     with an optional `data-cursor-label="Shop"` override;
 *   - otherwise buttons → BUTTON, links → LINK, photos → MEDIA,
 *     text fields → native caret.
 *
 * Movement lives in MotionValues; React only re-renders when the *state*
 * changes (entering a link, a product, …), never on mouse movement.
 * Desktop fine pointers with motion allowed only — touch never mounts it.
 */
type CursorKind = "default" | "link" | "button" | "media" | "label" | "native" | "hidden";
type CursorState = { kind: CursorKind; label?: string; tone?: "ink" | "clay" };

const DEFAULT_LABELS: Record<string, string> = {
  view: "View",
  explore: "Explore",
  drag: "Drag",
};

function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return { kind: "default" };

  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const key = tagged.dataset.cursor ?? "";
    if (key === "none") return { kind: "hidden" };
    if (key === "link") return { kind: "link" };
    if (key === "button") return { kind: "button" };
    const label = tagged.dataset.cursorLabel || DEFAULT_LABELS[key];
    // Explore = entering somewhere (clay, with an arrow); view/drag = looking at a product (ink).
    if (label) return { kind: "label", label, tone: key === "explore" ? "clay" : "ink" };
  }

  if (target.closest('input:not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]')) {
    return { kind: "native" };
  }
  if (target.closest('button, [role="button"], [role="menuitem"], [role="tab"], summary, label[for]')) {
    return { kind: "button" };
  }
  if (target.closest("a[href]")) return { kind: "link" };
  if (target instanceof HTMLImageElement) return { kind: "media" };
  return { kind: "default" };
}

const sameState = (a: CursorState, b: CursorState) => a.kind === b.kind && a.label === b.label && a.tone === b.tone;

/** How far the cursor leans toward a button's centre, and the cap in px. */
const MAGNET = { pull: 0.28, max: 7 };

/** Per-state shape of each layer. Scales only, so every change is a transform. */
const LOOK: Record<CursorKind, { core: number; coreOn: boolean; aura: number; auraOpacity: number; ring: number; ringOn: boolean }> = {
  default: { core: 1, coreOn: true, aura: 1, auraOpacity: 0.75, ring: 0.6, ringOn: false },
  link: { core: 0.7, coreOn: true, aura: 1.15, auraOpacity: 0.6, ring: 1, ringOn: true },
  button: { core: 0.7, coreOn: true, aura: 1.35, auraOpacity: 0.55, ring: 1.4, ringOn: true },
  media: { core: 1, coreOn: true, aura: 2.1, auraOpacity: 0.42, ring: 0.6, ringOn: false },
  label: { core: 0.8, coreOn: true, aura: 1.7, auraOpacity: 0.55, ring: 0.6, ringOn: false },
  native: { core: 0, coreOn: false, aura: 0.6, auraOpacity: 0, ring: 0.6, ringOn: false },
  hidden: { core: 0, coreOn: false, aura: 0.6, auraOpacity: 0, ring: 0.6, ringOn: false },
};

export function Cursor() {
  const { x, y, present, enabled } = usePointer();
  const [state, setState] = useState<CursorState>({ kind: "default" });
  const [pressed, setPressed] = useState(false);

  // The button the cursor is leaning toward (centre in client px), if any.
  const magnet = useRef<{ cx: number; cy: number } | null>(null);
  const lean = (axis: "x" | "y") => () => {
    const px = x.get();
    const py = y.get();
    const target = magnet.current;
    if (!target) return axis === "x" ? px : py;
    let dx = (target.cx - px) * MAGNET.pull;
    let dy = (target.cy - py) * MAGNET.pull;
    const length = Math.hypot(dx, dy);
    if (length > MAGNET.max) {
      dx = (dx / length) * MAGNET.max;
      dy = (dy / length) * MAGNET.max;
    }
    return axis === "x" ? px + dx : py + dy;
  };
  const tx = useTransform(lean("x"));
  const ty = useTransform(lean("y"));

  const coreX = useSpring(tx, follow.cursorDot);
  const coreY = useSpring(ty, follow.cursorDot);
  const ringX = useSpring(tx, follow.cursorRing);
  const ringY = useSpring(ty, follow.cursorRing);
  const auraX = useSpring(tx, follow.cursorAura);
  const auraY = useSpring(ty, follow.cursorAura);

  // Wet-ink stretch: the aura elongates (≤ 30%) along its direction of travel.
  const vx = useVelocity(auraX);
  const vy = useVelocity(auraY);
  const speed = useTransform(() => Math.hypot(vx.get(), vy.get()));
  const angle = useTransform(() => (Math.atan2(vy.get(), vx.get()) * 180) / Math.PI);
  const stretch = useTransform(speed, [0, 2600], [1, 1.3], { clamp: true });
  const squash = useTransform(speed, [0, 2600], [1, 0.84], { clamp: true });

  const presence = useSpring(present, { stiffness: 260, damping: 32 });

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const next = resolveState(event.target);
      setState((prev) => (sameState(prev, next) ? prev : next));

      const button =
        next.kind === "button" && event.target instanceof Element
          ? event.target.closest<HTMLElement>('button, [role="button"], [data-cursor="button"]')
          : null;
      if (button) {
        const r = button.getBoundingClientRect();
        // Only lean toward control-sized things, never whole panels.
        magnet.current = r.width < 320 && r.height < 120 ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null;
      } else {
        magnet.current = null;
      }
    };
    const onScroll = () => {
      magnet.current = null;
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") setPressed(true);
    };
    const onUp = () => setPressed(false);

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("blur", onUp);
    return () => {
      root.classList.remove("has-custom-cursor");
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("blur", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  const { kind, label, tone } = state;
  const look = LOOK[kind];
  const press = pressed ? 0.8 : 1;
  const interactive = kind === "link" || kind === "button" || kind === "label";

  return (
    <m.div aria-hidden className="pointer-events-none fixed inset-0 z-[100]" style={{ opacity: presence }}>
      {/* Aura: a soft clay glow, a beat behind, stretched by speed. */}
      <m.div className="absolute left-0 top-0" style={{ x: auraX, y: auraY, rotate: angle, scaleX: stretch, scaleY: squash }}>
        <m.span
          className="cursor-aura block size-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
          initial={false}
          animate={{ scale: look.aura * (pressed ? 0.85 : 1), opacity: look.auraOpacity }}
          transition={{ type: "spring", stiffness: 200, damping: 26, mass: 0.7 }}
        />
      </m.div>

      {/* Ring: a hairline for links and buttons only. */}
      <m.div className="absolute left-0 top-0" style={{ x: ringX, y: ringY }}>
        <m.span
          className={`block size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-200 ${
            kind === "button" ? "border-clay/45 bg-clay/[0.07]" : "border-clay/60"
          }`}
          initial={false}
          animate={{ scale: look.ring * press, opacity: look.ringOn ? 1 : 0 }}
          transition={spring.tactile}
        />
      </m.div>

      {/* Core: the ink point. A paper halo keeps it visible over photos. */}
      <m.div className="absolute left-0 top-0" style={{ x: coreX, y: coreY }}>
        <m.span
          className={`block size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--paper)_75%,transparent)] transition-colors duration-200 ${
            interactive ? "bg-clay" : "bg-ink"
          }`}
          initial={false}
          animate={{ scale: look.core * press, opacity: look.coreOn ? 1 : 0 }}
          transition={spring.tactile}
        />
      </m.div>

      {/* Caption: "View", "Open", "Enter"… set small beside the point, never over the content. */}
      <m.div className="absolute left-0 top-0" style={{ x: ringX, y: ringY }}>
        <AnimatePresence>
          {kind === "label" && label && (
            <m.span
              key={`${label}-${tone}`}
              className={`absolute left-4 top-4 flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[5px] text-[10px] font-bold uppercase leading-none tracking-[0.18em] shadow-[0_6px_16px_-8px_hsl(var(--shadow-color)/0.55)] ${
                tone === "clay" ? "bg-clay text-paper" : "bg-ink text-paper"
              }`}
              initial={{ opacity: 0, x: -4, y: -4, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: press }}
              exit={{ opacity: 0, x: -4, y: -4, scale: 0.92, transition: { duration: 0.15 } }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              {label}
              {tone === "clay" && (
                <svg viewBox="0 0 20 20" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M4 10h11M11 6l4 4-4 4" />
                </svg>
              )}
            </m.span>
          )}
        </AnimatePresence>
      </m.div>
    </m.div>
  );
}
