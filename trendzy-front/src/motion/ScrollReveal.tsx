import type { ReactNode } from "react";
import { m } from "framer-motion";
import { duration, ease, stagger } from "@/motion/tokens";

/**
 * Reveals content as it enters the viewport — once.
 *
 * Use for BELOW-the-fold content only: the hidden start state is part of the
 * server HTML, so never wrap the hero or the LCP image in it.
 *
 * `index` staggers list items, but only the first `stagger.maxItems` wait;
 * everything after arrives immediately so long lists never feel slow. For a
 * freshly loaded batch, pass the index within that batch.
 */
export function ScrollReveal({
  children,
  index = 0,
  delay = 0,
  y = 16,
  amount = 0.2,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const Tag = m[as];
  const staggerDelay = index < stagger.maxItems ? index * stagger.step : 0;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: duration.slow, ease: ease.drift, delay: delay + staggerDelay }}
    >
      {children}
    </Tag>
  );
}
