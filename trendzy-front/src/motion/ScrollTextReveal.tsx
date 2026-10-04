import { useRef, type ElementType } from "react";
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

/**
 * Editorial "typed by scrolling" text. Each word (or character) appears as
 * scroll progress passes its slot, so the reader reveals the line themselves.
 *
 * Reserve it for major statements — never body copy.
 *
 * - Pass `progress` (e.g. a ScrollScene's progress) plus a `range` within it to
 *   sequence several lines in one pinned scene.
 * - Without `progress`, it tracks its own position in the viewport.
 * - Reduced motion: renders the plain sentence, fully visible.
 * - Screen readers always get the whole sentence once.
 */
type Props = {
  text: string;
  by?: "word" | "char";
  progress?: MotionValue<number>;
  /** Portion of `progress` over which this text reveals. */
  range?: [number, number];
  as?: ElementType;
  className?: string;
  /** Opacity of not-yet-revealed units. 0 = typed-in; ~0.15 = ghosted. */
  dim?: number;
  /** How much neighbouring units overlap while revealing (0–3). Higher = smoother. */
  softness?: number;
};

export function ScrollTextReveal({
  text,
  by = "word",
  progress,
  range = [0, 1],
  as: Tag = "p",
  className = "",
  dim = 0,
  softness = 1.5,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const source = progress ?? scrollYProgress;

  if (reduced) {
    return (
      <Tag ref={ref} className={className}>
        {text}
      </Tag>
    );
  }

  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const units = by === "word" ? words.filter((w) => !/^\s+$/.test(w)).length : text.replace(/\s+/g, "").length;
  const [start, end] = range;
  const slot = (end - start) / Math.max(units, 1);

  let unitIndex = 0;

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, wi) => {
          if (/^\s+$/.test(word)) return <span key={wi}> </span>;

          if (by === "word") {
            const i = unitIndex++;
            return (
              <RevealUnit key={wi} progress={source} from={start + i * slot} to={Math.min(start + (i + 1 + softness) * slot, end)} dim={dim} lift>
                {word}
              </RevealUnit>
            );
          }

          // Characters, grouped per word so lines only break between words.
          return (
            <span key={wi} className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, ci) => {
                const i = unitIndex++;
                return (
                  <RevealUnit key={ci} progress={source} from={start + i * slot} to={Math.min(start + (i + 1 + softness) * slot, end)} dim={dim}>
                    {char}
                  </RevealUnit>
                );
              })}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}

function RevealUnit({
  children,
  progress,
  from,
  to,
  dim,
  lift = false,
}: {
  children: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
  dim: number;
  lift?: boolean;
}) {
  const opacity = useTransform(progress, [from, to], [dim, 1], { clamp: true });
  const y = useTransform(progress, [from, to], ["0.18em", "0em"], { clamp: true });
  return (
    <m.span className="inline-block" style={lift ? { opacity, y } : { opacity }}>
      {children}
    </m.span>
  );
}
