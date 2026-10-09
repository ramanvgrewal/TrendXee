import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionValue, useReducedMotion, useScroll, useSpring, type MotionValue } from "framer-motion";
import { follow } from "@/motion/tokens";

/**
 * A pinned scene: the stage sticks to the viewport while the reader scrolls
 * through `length` screens of runway, and `progress` (0 → 1) drives whatever
 * happens on stage — text reveals, image moves, hand-offs to the next scene.
 *
 *   <ScrollScene length={3} mobileLength={2}>
 *     {(progress) => <ScrollTextReveal progress={progress} range={[0, 0.4]} … />}
 *   </ScrollScene>
 *
 * Normal scrolling is never hijacked: it is plain document scroll with a
 * sticky child. Reduced motion: no pinning, progress is fixed at 1 so every
 * piece of content is simply shown.
 */
const SceneContext = createContext<MotionValue<number> | null>(null);

export function useSceneProgress() {
  const progress = useContext(SceneContext);
  if (!progress) throw new Error("useSceneProgress must be used inside <ScrollScene>");
  return progress;
}

export function ScrollScene({
  children,
  length = 3,
  mobileLength = 2,
  smooth = true,
  className = "",
  stageClassName = "",
  id,
}: {
  children: ReactNode | ((progress: MotionValue<number>) => ReactNode);
  /** Runway in viewport heights on desktop (including the pinned screen). */
  length?: number;
  /** Shorter runway on phones. */
  mobileLength?: number;
  /** Lightly spring-smooth the progress so wheel steps don't feel stepped. */
  smooth?: boolean;
  className?: string;
  stageClassName?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothed = useSpring(scrollYProgress, follow.scroll);
  const done = useMotionValue(1);

  const progress = reduced ? done : smooth ? smoothed : scrollYProgress;
  const content = typeof children === "function" ? children(progress) : children;

  if (reduced) {
    return (
      <SceneContext.Provider value={progress}>
        <section id={id} ref={ref} className={className}>
          <div className={`relative min-h-[100svh] ${stageClassName}`}>{content}</div>
        </section>
      </SceneContext.Provider>
    );
  }

  return (
    <SceneContext.Provider value={progress}>
      <section
        id={id}
        ref={ref}
        className={`relative h-[calc(var(--scene-m)*100svh)] md:h-[calc(var(--scene-d)*100svh)] ${className}`}
        style={{ "--scene-d": length, "--scene-m": mobileLength } as CSSProperties}
      >
        <div className={`sticky top-0 h-[100svh] overflow-hidden ${stageClassName}`}>{content}</div>
      </section>
    </SceneContext.Provider>
  );
}
