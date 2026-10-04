import { useEffect, useRef, type ReactNode } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";
import { usePointer } from "@/motion/pointer";
import { follow, travel } from "@/motion/tokens";

/**
 * Lets an important control lean a few pixels toward the pointer.
 *
 * Use sparingly: hero CTA, key nav actions, lane controls, bookmark. The pull
 * is capped at `max` px (default 6) and is pure transform, so layout never
 * shifts. Reads the global pointer — no mousemove listener of its own.
 */
export function Magnetic({
  children,
  strength = 0.3,
  max = travel.magnetic,
  className = "",
  block = false,
}: {
  children: ReactNode;
  /** Fraction of the pointer's offset from centre to follow. */
  strength?: number;
  /** Hard cap on travel, px. */
  max?: number;
  className?: string;
  /** Render as a block-level wrapper instead of inline-block. */
  block?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { x, y, enabled } = usePointer();
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const sx = useSpring(tx, follow.magnetic);
  const sy = useSpring(ty, follow.magnetic);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    let cx = 0;
    let cy = 0;
    let unsubscribe: Array<() => void> = [];

    const update = () => {
      let dx = (x.get() - cx) * strength;
      let dy = (y.get() - cy) * strength;
      const length = Math.hypot(dx, dy);
      if (length > max) {
        dx = (dx / length) * max;
        dy = (dy / length) * max;
      }
      tx.set(dx);
      ty.set(dy);
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      // Measure the resting position, not wherever the spring currently is.
      cx = rect.left + rect.width / 2 - sx.get();
      cy = rect.top + rect.height / 2 - sy.get();
      unsubscribe = [x.on("change", update), y.on("change", update)];
      update();
    };
    const onLeave = () => {
      unsubscribe.forEach((off) => off());
      unsubscribe = [];
      tx.set(0);
      ty.set(0);
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [enabled, strength, max, x, y, tx, ty, sx, sy]);

  return (
    <m.span
      ref={ref}
      className={`${block ? "block" : "inline-block"} ${className}`}
      style={enabled ? { x: sx, y: sy } : undefined}
    >
      {children}
    </m.span>
  );
}
