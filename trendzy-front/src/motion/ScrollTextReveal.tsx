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
  /** Self-tracking window, as useScroll offsets. Defaults suit mid-page text. */
  offset?: [string, string];
};

export function ScrollTextReveal(props: Props) {
  const reduced = useReducedMotion();
  const Tag = props.as ?? "p";

  if (reduced) {
    return <Tag className={props.className}>{props.text}</Tag>;
  }

  if (props.progress) {
    return <RevealBody {...props} source={props.progress} />;
  }

  return <SelfTrackedScrollTextReveal {...props} />;
}

function SelfTrackedScrollTextReveal(props: Props) {
  const ref = useRef<HTMLElement>(null);
  const offset = props.offset ?? ["start 85%", "end 45%"];
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as never });
  return <RevealBody {...props} innerRef={ref} source={scrollYProgress} />;
}

function RevealBody({
  text,
  by = "word",
  source,
  range = [0, 1],
  as: Tag = "p",
  className = "",
  dim = 0,
  softness = 1.5,
  innerRef,
}: Props & { source: MotionValue<number>; innerRef?: React.RefObject<HTMLElement | null> }) {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const units = by === "word" ? words.filter((w) => !/^\s+$/.test(w)).length : text.replace(/\s+/g, "").length;
  const [start, end] = range;
  const slot = (end - start) / Math.max(units, 1);

  let unitIndex = 0;

  return (
    <Tag ref={innerRef} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, wi) => {
          if (/^\s+$/.test(word)) return <span key={wi}> </span>;

          if (by === "word") {
            const i = unitIndex++;
            return (
              <RevealUnitLift
                key={wi}
                progress={source}
                from={start + i * slot}
                to={Math.min(start + (i + 1 + softness) * slot, end)}
                dim={dim}
              >
                {word}
              </RevealUnitLift>
            );
          }

          // Characters, grouped per word so lines only break between words.
          return (
            <span key={wi} className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, ci) => {
                const i = unitIndex++;
                return (
                  <RevealUnitOpacity
                    key={ci}
                    progress={source}
                    from={start + i * slot}
                    to={Math.min(start + (i + 1 + softness) * slot, end)}
                    dim={dim}
                  >
                    {char}
                  </RevealUnitOpacity>
                );
              })}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}

function RevealUnitOpacity({
  children,
  progress,
  from,
  to,
  dim,
}: {
  children: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
  dim: number;
}) {
  const opacity = useTransform(progress, [from, to], [dim, 1], { clamp: true });
  return (
    <m.span className="inline-block" style={{ opacity }}>
      {children}
    </m.span>
  );
}

function RevealUnitLift({
  children,
  progress,
  from,
  to,
  dim,
}: {
  children: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
  dim: number;
}) {
  const opacity = useTransform(progress, [from, to], [dim, 1], { clamp: true });
  const y = useTransform(progress, [from, to], ["0.18em", "0em"], { clamp: true });
  return (
    <m.span className="inline-block" style={{ opacity, y }}>
      {children}
    </m.span>
  );
}
