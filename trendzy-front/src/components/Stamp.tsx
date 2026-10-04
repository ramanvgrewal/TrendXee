import { m } from "framer-motion";
import { spring } from "@/motion/tokens";

type StampProps = {
  score: number;
  tone?: "clay" | "olive";
  size?: "sm" | "md" | "lg";
  /** Give the stamp a small physical press when touched or clicked. */
  pressable?: boolean;
  className?: string;
};

// Bold numerals at ≥19px count as large text, so the stamp ink meets 3:1+.
const sizes = {
  sm: "size-9 text-[15px]",
  md: "size-11 text-[19px]",
  lg: "size-14 text-[22px]",
};

/** The inked trend score, printed like a rubber stamp on the board. */
export function Stamp({ score, tone = "clay", size = "md", pressable = false, className = "" }: StampProps) {
  return (
    <m.span
      aria-label={`Trend score ${score}`}
      role="img"
      whileHover={pressable ? { rotate: -4, scale: 1.05 } : undefined}
      whileTap={pressable ? { scale: 0.9, rotate: -8 } : undefined}
      transition={spring.tactile}
      className={`stamp grid shrink-0 place-items-center rounded-full font-display font-bold tabular-nums text-paper ${
        tone === "clay" ? "bg-stamp-clay" : "bg-stamp-olive"
      } ${sizes[size]} ${className}`}
    >
      {score}
    </m.span>
  );
}
