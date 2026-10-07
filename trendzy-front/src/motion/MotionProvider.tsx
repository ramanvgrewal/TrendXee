import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "framer-motion";
import { PointerProvider } from "@/motion/pointer";
import { Cursor } from "@/motion/Cursor";
import { AmbientLight } from "@/motion/AmbientLight";

const loadFeatures = () => import("@/motion/features").then((mod) => mod.default);

/**
 * Root of the motion system. Mounted once in __root.tsx so the cursor and
 * pointer state survive route changes.
 *
 * - LazyMotion + `m` components keep the animation runtime out of the first
 *   bundle; `strict` stops anyone importing the heavy `motion.*` components.
 * - reducedMotion="user": with the OS setting on, transform and layout
 *   animations are dropped and only opacity changes remain.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <PointerProvider>
          <AmbientLight />
          {children}
          <Cursor />
        </PointerProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
