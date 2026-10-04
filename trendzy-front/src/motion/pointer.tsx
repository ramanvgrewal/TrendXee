import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { motionValue, useMotionValue, useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import { follow } from "@/motion/tokens";
import { useFinePointer } from "@/motion/hooks";

/**
 * One global pointer tracker for the whole site.
 *
 * A single passive `pointermove` listener on window writes into MotionValues.
 * Nothing here touches React state on movement, so moving the mouse never
 * re-renders the tree. Components derive their own transforms by subscribing
 * to these values (see `useRelativePointer`, `Magnetic`, `Parallax`, `Cursor`).
 */
type PointerContextValue = {
  /** Client-space px. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Viewport-normalised, −1 (left/top) … 1 (right/bottom). */
  nx: MotionValue<number>;
  ny: MotionValue<number>;
  /** 1 while the pointer is inside the window, else 0. */
  present: MotionValue<number>;
  /** Cursor-reactive effects should run (fine pointer, motion allowed). */
  enabled: boolean;
};

const PointerContext = createContext<PointerContextValue | null>(null);

export function PointerProvider({ children }: { children: ReactNode }) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const present = useMotionValue(0);

  const finePointer = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = finePointer && !reduced;

  useEffect(() => {
    if (!enabled) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      nx.set((event.clientX / width) * 2 - 1);
      ny.set((event.clientY / height) * 2 - 1);
      if (present.get() === 0) present.set(1);
    };
    const onLeave = () => present.set(0);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      present.set(0);
      nx.set(0);
      ny.set(0);
    };
  }, [enabled, x, y, nx, ny, present]);

  const value = useMemo(() => ({ x, y, nx, ny, present, enabled }), [x, y, nx, ny, present, enabled]);

  return <PointerContext.Provider value={value}>{children}</PointerContext.Provider>;
}

// Inert values for anything rendered outside the provider (or during a dev
// hot-reload): effects simply stay off instead of crashing the page.
const INERT: PointerContextValue = {
  x: motionValue(-100),
  y: motionValue(-100),
  nx: motionValue(0),
  ny: motionValue(0),
  present: motionValue(0),
  enabled: false,
};

export function usePointer() {
  return useContext(PointerContext) ?? INERT;
}

/**
 * Pointer position relative to an element, −1 … 1 on each axis, spring-smoothed.
 *
 * - `mode: "hover"` (default): tracks only while the pointer is over the
 *   element and eases back to centre when it leaves. Use for cards.
 * - `mode: "viewport"`: follows the viewport-normalised pointer. Use for the
 *   hero, where the whole screen is the stage.
 *
 * The element rect is measured on enter (and on scroll while hovered), never
 * per frame.
 */
export function useRelativePointer(
  ref: RefObject<HTMLElement | null>,
  { mode = "hover" }: { mode?: "hover" | "viewport" } = {},
) {
  const { x, y, nx, ny, enabled } = usePointer();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const sx = useSpring(rx, follow.parallax);
  const sy = useSpring(ry, follow.parallax);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (mode === "viewport") {
      const offX = nx.on("change", (v) => rx.set(v));
      const offY = ny.on("change", (v) => ry.set(v));
      return () => {
        offX();
        offY();
        rx.set(0);
        ry.set(0);
      };
    }

    const el = ref.current;
    if (!el) return;

    let rect: DOMRect | null = null;
    let unsubscribe: Array<() => void> = [];
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const update = () => {
      if (!rect) return;
      rx.set(clamp(((x.get() - rect.left) / rect.width) * 2 - 1));
      ry.set(clamp(((y.get() - rect.top) / rect.height) * 2 - 1));
    };
    const measure = () => {
      rect = el.getBoundingClientRect();
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      measure();
      unsubscribe = [x.on("change", update), y.on("change", update)];
      window.addEventListener("scroll", measure, { passive: true, capture: true });
      setHovered(true);
      update();
    };
    const onLeave = () => {
      unsubscribe.forEach((off) => off());
      unsubscribe = [];
      window.removeEventListener("scroll", measure, { capture: true });
      rect = null;
      rx.set(0);
      ry.set(0);
      setHovered(false);
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [enabled, mode, ref, x, y, nx, ny, rx, ry]);

  return { rx: sx, ry: sy, hovered, enabled };
}
