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
      transition={spring.tactile}
    >
      {children}
    </m.span>
  );
  return magnetic ? <Magnetic>{body}</Magnetic> : body;
}

const base =
  "group/cta relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-ink text-paper shadow-print hover:bg-clay hover:text-paper",
  accent: "bg-clay text-paper shadow-print hover:bg-ink",
  outline: "border border-ink/20 text-ink hover:border-ink/60 hover:bg-ink/[0.03]",
  ghost: "text-ink hover:text-clay",
  onScrim: "bg-on-scrim text-scrim hover:bg-clay hover:text-on-scrim",
} as const;

const sizes = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
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
