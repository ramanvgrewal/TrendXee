import { useCallback, useEffect, useState } from "react";
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
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const swap = () => {
      apply(next);
      setTheme(next);
    };
    if (doc.startViewTransition && !reduced) doc.startViewTransition(swap);
    else swap();
  }, []);

  return { theme, toggle };
}

export function ThemeIcon({ theme }: { theme: Theme }) {
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
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        ) : (
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        )}
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
      onClick={toggle}
      className={`grid size-9 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink ${className}`}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
