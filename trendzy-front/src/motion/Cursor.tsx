import { useEffect, useState } from "react";
import { AnimatePresence, m, useSpring, useTransform } from "framer-motion";
import { usePointer } from "@/motion/pointer";
import { follow, spring } from "@/motion/tokens";

/**
 * The TrendXee pointer: a small ink dot with a ring that trails a hair behind.
 *
 * States are read from the DOM, not wired per component:
 *   - `data-cursor="view" | "explore" | "drag" | "none"` on any element,
 *     with an optional `data-cursor-label="Shop"` override;
 *   - otherwise links → LINK, buttons → BUTTON, text fields → native caret.
 *
 * Movement lives in MotionValues; React only re-renders when the *state*
 * changes (entering a link, a product, …), never on mouse movement.
 * Desktop fine pointers only — touch devices never mount it.
 */
type CursorKind = "default" | "link" | "button" | "label" | "native" | "hidden";
type CursorState = { kind: CursorKind; label?: string };

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
    if (label) return { kind: "label", label };
  }

  if (target.closest('input:not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]')) {
    return { kind: "native" };
  }
  if (target.closest('button, [role="button"], [role="menuitem"], [role="tab"], summary, label[for]')) {
    return { kind: "button" };
  }
  if (target.closest("a[href]")) return { kind: "link" };
  return { kind: "default" };
}

const sameState = (a: CursorState, b: CursorState) => a.kind === b.kind && a.label === b.label;

export function Cursor() {
  const { x, y, present, enabled } = usePointer();
  const [state, setState] = useState<CursorState>({ kind: "default" });
  const [pressed, setPressed] = useState(false);

  const dotX = useSpring(x, follow.cursorDot);
  const dotY = useSpring(y, follow.cursorDot);
  const ringX = useSpring(x, follow.cursorRing);
  const ringY = useSpring(y, follow.cursorRing);
  const presence = useSpring(present, { stiffness: 300, damping: 30 });
  const opacity = useTransform(presence, [0, 1], [0, 1]);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const next = resolveState(event.target);
      setState((prev) => (sameState(prev, next) ? prev : next));
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") setPressed(true);
    };
    const onUp = () => setPressed(false);

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    return () => {
      root.classList.remove("has-custom-cursor");
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  const { kind, label } = state;
  const showLabel = kind === "label";
  const hide = kind === "hidden" || kind === "native";
  const press = pressed ? 0.82 : 1;

  const ring = {
    default: { scale: 0.35, opacity: 0 },
    link: { scale: 1, opacity: 1 },
    button: { scale: 1.3, opacity: 1 },
    label: { scale: 0.6, opacity: 0 },
    native: { scale: 0.35, opacity: 0 },
    hidden: { scale: 0.35, opacity: 0 },
  }[kind];

  const dot = {
    default: { scale: 1, opacity: 1 },
    link: { scale: 0.65, opacity: 1 },
    button: { scale: 0.65, opacity: 1 },
    label: { scale: 0, opacity: 0 },
    native: { scale: 0, opacity: 0 },
    hidden: { scale: 0, opacity: 0 },
  }[kind];

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: hide ? 0 : opacity }}
    >
      {/* Ring: trails the pointer slightly, appears over links and buttons. */}
      <m.div className="absolute left-0 top-0" style={{ x: ringX, y: ringY }}>
        <m.span
          className={`block size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-200 ${
            kind === "button" ? "border-ink/35 bg-clay/10" : "border-clay/70"
          }`}
          initial={false}
          animate={{ scale: ring.scale * press, opacity: ring.opacity }}
          transition={spring.tactile}
        />
      </m.div>

      {/* Dot: sits on the pointer. Paper outline keeps it visible over photos. */}
      <m.div className="absolute left-0 top-0" style={{ x: dotX, y: dotY }}>
        <m.span
          className={`block size-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_1.5px_var(--paper)] transition-colors duration-200 ${
            kind === "default" ? "bg-ink" : "bg-clay"
          }`}
          initial={false}
          animate={{ scale: dot.scale * press, opacity: dot.opacity }}
          transition={spring.tactile}
        />
      </m.div>

      {/* Contextual label: "View", "Explore", "Drag"… */}
      <m.div className="absolute left-0 top-0" style={{ x: ringX, y: ringY }}>
        <AnimatePresence>
          {showLabel && (
            <m.span
              key={label}
              className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sand shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--ink)_60%,transparent)]"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: press, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={spring.tactile}
            >
              {label}
            </m.span>
          )}
        </AnimatePresence>
      </m.div>
    </m.div>
  );
}
