import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "framer-motion";
import { PointerProvider } from "@/motion/pointer";
import { Cursor } from "@/motion/Cursor";
import { AmbientLight } from "@/motion/AmbientLight";
import { usePrefersReducedMotion } from "@/motion/hooks";

const loadFeatures = () => import("@/motion/features").then((mod) => mod.default);

/**
 * Root of the motion system. Mounted once in __root.tsx so the cursor and
 * pointer state survive route changes.
 *
 * - LazyMotion + `m` components keep the animation runtime out of the first
 *   bundle; `strict` stops anyone importing the heavy `motion.*` components.
 * - The OS setting is applied after hydration so the initial styles match
 *   server HTML. Reduced motion then drops transform and layout animations.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={reduced ? "always" : "never"}>
        <PointerProvider>
          <AmbientLight />
          {children}
          <Cursor />
        </PointerProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
