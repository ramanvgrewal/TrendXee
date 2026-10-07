import type { ReactNode } from "react";
import { m } from "framer-motion";
import { Magnetic } from "@/motion/Magnetic";
import { spring } from "@/motion/tokens";

/**
 * Tactile call-to-action shell. Wrap a <Link>, <a> or <button> in it:
 *
 *   <Cta><Link to="/lanes" className={ctaClass("primary")}>Explore</Link></Cta>
 *
 * Hover lifts 1px, press settles to 0.97, release springs back. Magnetic pull
 * is opt-in (`magnetic`) because only the important actions should have it.
 */
export function Cta({
  children,
  magnetic = false,
  className = "",
}: {
  children: ReactNode;
  magnetic?: boolean;
  className?: string;
}) {
  const body = (
    <m.span
      className={`inline-flex ${className}`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97, y: 0 }}
      // Motion makes tap targets focusable; the real link/button inside already is.
      tabIndex={-1}
      transition={spring.tactile}
    >
      {children}
    </m.span>
  );
  return magnetic ? <Magnetic>{body}</Magnetic> : body;
}

const base =
  "group/cta relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold tracking-[0.005em] transition-[background-color,color,box-shadow,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none [&_svg]:shrink-0";

const variants = {
  /** The main action. Ink on paper, warms to clay on hover, compresses on press. */
  primary: "bg-ink text-paper shadow-print hover:bg-clay hover:text-paper hover:shadow-lift active:shadow-press",
  /** Clay accent — for "saved" and other affirmative states. */
  accent: "bg-clay text-paper shadow-print hover:bg-ink hover:shadow-lift active:shadow-press",
  /** Quiet secondary action. Ring, not border, so states never shift layout. */
  outline:
    "bg-raised/60 text-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink)_18%,transparent)] hover:bg-raised hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ink)_45%,transparent),var(--shadow-card)] active:shadow-press",
  ghost: "text-ink hover:bg-ink/[0.05] hover:text-clay",
  onScrim: "bg-on-scrim text-scrim shadow-print hover:bg-clay hover:text-on-scrim",
} as const;

/** Consistent heights: 36 / 44 / 52px. */
const sizes = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-7 text-[15px]",
} as const;

export function ctaClass(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md") {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

/** Arrow that nudges forward on hover of its CTA. */
export function CtaArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`size-4 transition-transform duration-300 ease-out group-hover/cta:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 10h12.5M11.5 5l5 5-5 5" />
    </svg>
  );
}
