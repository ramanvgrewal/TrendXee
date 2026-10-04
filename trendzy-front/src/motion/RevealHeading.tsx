import type { ElementType, ReactNode } from "react";
import { m } from "framer-motion";
import { ease } from "@/motion/tokens";

/**
 * A section heading that rises into place line by line as it enters the
 * viewport — once. Each line is masked, so the text slides up from behind
 * its own baseline rather than fading. Reserve it for section headings;
 * paragraphs stay still. Reduced motion: the lines simply appear.
 */
export function RevealHeading({
  lines,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        // The mask is what we observe: the line itself starts clipped (fully
        // outside its mask), so an observer on it would never fire.
        <m.span
          key={i}
          className="-mb-[0.12em] block overflow-hidden pb-[0.12em]"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.5 }}
        >
          <m.span
            className="block"
            variants={{ hidden: { y: "108%" }, shown: { y: "0%" } }}
            transition={{ duration: 0.75, ease: ease.drift, delay: delay + i * 0.08 }}
          >
            {line}
          </m.span>
        </m.span>
      ))}
    </Tag>
  );
}
