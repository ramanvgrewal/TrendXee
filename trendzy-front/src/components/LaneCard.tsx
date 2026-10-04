import { Link } from "@tanstack/react-router";
import { m } from "framer-motion";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { spring } from "@/motion/tokens";
import type { Aesthetic } from "@/lib/mock-data";
import { laneLabel } from "@/lib/format";
import { Img } from "@/components/Img";

/**
 * A lane as a destination: oversized index numeral, the lane's own photo,
 * its name set large. Hover lifts the card, drifts the photo against the
 * pointer and reveals the "enter" affordance. The photo carries a
 * view-transition name so it can travel into the lane page's hero.
 */
export function LaneCard({
  aesthetic,
  index,
  image,
  brand,
  className = "",
  eager = false,
}: {
  aesthetic: Aesthetic;
  index: number;
  image?: string;
  brand?: string;
  className?: string;
  eager?: boolean;
}) {
  const src = image || aesthetic.heroImage;
  const isSneaker = aesthetic.id === "sneakers";

  return (
    <m.div
      className={`group/lane relative ${className}`}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98, y: -2 }}
      transition={spring.soft}
    >
      <Link
        to="/aesthetic/$id"
        params={{ id: aesthetic.id }}
        viewTransition
        data-cursor="explore"
        data-cursor-label="Enter"
        className="block h-full rounded-[26px] outline-offset-4"
      >
        <PointerScope className="relative h-full overflow-hidden rounded-[26px] bg-cream shadow-print transition-shadow duration-500 group-hover/lane:shadow-lift group-active/lane:shadow-press">
          {/* Photo */}
          <div className="absolute inset-0" style={{ viewTransitionName: `lane-${aesthetic.id}` }}>
            {isSneaker && (
              <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" />
            )}
            <Parallax depth={5} bleed className="absolute inset-0">
              <Img
                src={src}
                eager={eager}
                fallbackLabel={laneLabel(aesthetic.name)}
                className={`h-full w-full group-hover/lane:scale-[1.03] ${isSneaker ? "object-contain p-8" : "object-cover"}`}
              />
            </Parallax>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/15 to-scrim/30" />

          {/* Index numeral */}
          <span aria-hidden className="pointer-events-none absolute -left-1 -top-4 font-display text-[7.5rem] leading-none tracking-[-0.06em] text-on-scrim/25 transition-colors duration-500 group-hover/lane:text-on-scrim/40 sm:text-[9rem]">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Copy */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-on-scrim sm:p-7">
            <Parallax depth={1.5} follow>
              <h3 className="font-display text-[2.4rem] leading-none tracking-[-0.02em] sm:text-5xl">{laneLabel(aesthetic.name)}</h3>
              <p className="mt-3 line-clamp-2 max-w-[22rem] text-[14px] leading-relaxed text-on-scrim/75">{aesthetic.description}</p>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-on-scrim/20 pt-4 eyebrow">
                <span className="truncate text-on-scrim/75">
                  {brand ? (
                    <>
                      Today: <span className="font-display text-[13px] normal-case italic tracking-normal text-on-scrim">{brand}</span>
                    </>
                  ) : (
                    aesthetic.vibeTags.slice(0, 3).join(" · ")
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-on-scrim transition-transform duration-300 group-hover/lane:translate-x-0.5">
                  Enter
                  <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M3.5 10h12.5M11.5 5l5 5-5 5" />
                  </svg>
                </span>
              </div>
            </Parallax>
          </div>
        </PointerScope>
      </Link>
    </m.div>
  );
}
