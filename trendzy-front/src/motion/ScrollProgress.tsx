import { useEffect, useState } from "react";
import { m, useScroll, useSpring, useTransform } from "framer-motion";
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
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            setChapter({ n: el.dataset.chapter ?? "", title: el.dataset.chapterTitle ?? "" });
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex"
      style={{ opacity }}
    >
      <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-ink/60">{chapter.n}</span>
      <span className="relative block h-24 w-px overflow-hidden bg-ink/12">
        <m.span className="absolute inset-0 origin-top bg-clay" style={{ scaleY: fill }} />
      </span>
      <span className="max-h-40 overflow-hidden text-[9px] font-bold uppercase tracking-[0.24em] text-ink/40 [writing-mode:vertical-rl]">
        {chapter.title}
      </span>
    </m.div>
  );
}
