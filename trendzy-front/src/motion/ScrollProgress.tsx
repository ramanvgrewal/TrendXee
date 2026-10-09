import { useEffect, useRef, useState } from "react";
import { m, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { follow } from "@/motion/tokens";

/**
 * A quiet editorial reading rail: a short vertical hairline on the right edge
 * that fills as the page is read, labelled with the chapter currently on
 * screen (any element with `data-chapter="03"` and `data-chapter-title`).
 * Desktop only; the label only updates when the chapter changes.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, follow.scroll);
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);
  const [chapter, setChapter] = useState({ n: "01", title: "" });

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth < 1280) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (nodes.length === 0) return;

    const first = nodes[0];
    setChapter({ n: first.dataset.chapter ?? "01", title: first.dataset.chapterTitle ?? "" });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const n = el.dataset.chapter ?? "";
            const title = el.dataset.chapterTitle ?? "";
            setChapter((prev) => (prev.n === n ? prev : { n, title }));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex"
      style={{ opacity }}
    >
      <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-ink/70">{chapter.n}</span>
      <span className="relative block h-24 w-px overflow-hidden bg-ink/12">
        <m.span className="absolute inset-0 origin-top bg-clay" style={{ scaleY: fill }} />
      </span>
      <span className="max-h-40 overflow-hidden eyebrow text-[10px] text-ink/70 [writing-mode:vertical-rl]">
        {chapter.title}
      </span>
    </m.div>
  );
}
