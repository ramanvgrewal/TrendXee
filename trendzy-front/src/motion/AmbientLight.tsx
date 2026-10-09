import { m, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { usePointer } from "@/motion/pointer";
import { follow } from "@/motion/tokens";

/** Diameter of the light pool, px. Large, so it reads as room light, not a torch. */
const SIZE = 1200;

/**
 * Ambient light on the paper. A very large, very soft pool of warm light sits
 * behind the content and drifts toward the pointer on a slow, heavy spring,
 * so the sheet seems to catch the light as you move. Its colour shifts a
 * little per chapter (see `.ambient-light` in styles.css), so the room
 * changes as you move through the story.
 *
 * Cost: one fixed, composited layer moved by transform; no React renders on
 * movement, no repaints (the gradient itself never changes while moving).
 * Desktop fine pointers with motion allowed only.
 */
export function AmbientLight() {
  const { x, y, present, enabled } = usePointer();
  const lx = useSpring(useTransform(x, (v) => v - SIZE / 2), follow.ambient);
  const ly = useSpring(useTransform(y, (v) => v - SIZE / 2), follow.ambient);
  // Fades in when the pointer arrives, out when it leaves the window.
  const opacity = useSpring(present, { stiffness: 40, damping: 18 });

  // On arrival the light starts where the pointer is (no sweep in from a corner).
  useMotionValueEvent(present, "change", (value) => {
    if (value === 1) {
      lx.jump(x.get() - SIZE / 2);
      ly.jump(y.get() - SIZE / 2);
    }
  });

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      <m.div
        className="ambient-light absolute left-0 top-0 rounded-full"
        style={{ width: SIZE, height: SIZE, x: lx, y: ly, opacity }}
      />
    </div>
  );
}
