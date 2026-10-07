import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, m } from "framer-motion";
import { spring } from "@/motion/tokens";

type Theme = "light" | "dark";

const STORAGE_KEY = "trendxee-theme";

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the toggle still works for this session */
  }
}

/**
 * Day/night board. Reads the class the shell script already set, and swaps
 * with a soft cross-dissolve (View Transitions) where the browser supports
 * it and motion is allowed.
 */
// One source of truth: the class on <html> (set before first paint by the
// shell script). Every toggle on the page subscribes to it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getSnapshot = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const getServerSnapshot = (): Theme => "light";

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Switch theme. With View Transitions (and motion allowed) the new theme is
   * revealed as a circle growing from `origin` (the control that was used);
   * otherwise it swaps instantly. Scroll position and layout never change.
   */
  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const root = document.documentElement;
    const next: Theme = root.classList.contains("dark") ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const swap = () => apply(next);
    if (!doc.startViewTransition || reduced) return swap();

    const x = origin?.x ?? window.innerWidth - 40;
    const y = origin?.y ?? 32;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${r}px`);
    root.classList.add("theme-vt");
    const transition = doc.startViewTransition(swap);
    transition.finished.finally(() => root.classList.remove("theme-vt"));
  }, []);

  return { theme, toggle };
}

const SUN = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
);
const MOON = <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ThemeIcon({ theme }: { theme: Theme }) {
  // The server can't know the saved theme, so until hydration settles the
  // icon is chosen by CSS from the <html> class — no spin on page load.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <>
        <svg className="size-4 dark:hidden" {...iconProps}>
          {MOON}
        </svg>
        <svg className="hidden size-4 dark:block" {...iconProps}>
          {SUN}
        </svg>
      </>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.svg
        key={theme}
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ rotate: -60, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 60, scale: 0.6, opacity: 0 }}
        transition={spring.tactile}
        aria-hidden
      >
        {theme === "dark" ? SUN : MOON}
      </m.svg>
    </AnimatePresence>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to day board" : "Switch to night board"}
      title={theme === "dark" ? "Day board" : "Night board"}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className={`grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink ${className}`}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
