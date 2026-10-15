import { useEffect, useState } from "react";

/** SSR-safe media query. Returns `fallback` on the server and first client render. */
export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/** True only on devices with a real hovering pointer (mouse / trackpad). */
export function useFinePointer() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Keep the server and first client render identical, then apply the OS setting. */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Whether decorative motion should run. Reduced-motion users get instant,
 * low-motion state changes instead (MotionConfig also strips transforms).
 */
export function useMotionAllowed() {
  return !usePrefersReducedMotion();
}
