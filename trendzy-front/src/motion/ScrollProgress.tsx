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
  const { scrollY, scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, follow.scroll);
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);
  const [chapter, setChapter] = useState({ n: "01", title: "" });
  const nodes = useRef<HTMLElement[]>([]);
  const frame = useRef(0);

  // The chapter is whichever section crosses the middle of the viewport.
  // Checked at most once per frame, and state only changes on a new chapter.
  const measure = () => {
    frame.current = 0;
    const mid = window.innerHeight / 2;
    let current: HTMLElement | undefined;
    for (const node of nodes.current) if (node.getBoundingClientRect().top <= mid) current = node;
    const next = current ?? nodes.current[0];
    if (!next) return;
    // The room light reads the chapter from <html> (CSS only, no re-render).
    const root = document.documentElement;
    if (root.dataset.chapter !== next.dataset.chapter) root.dataset.chapter = next.dataset.chapter ?? "";
    setChapter((prev) =>
      prev.n === next.dataset.chapter ? prev : { n: next.dataset.chapter ?? "", title: next.dataset.chapterTitle ?? "" },
    );
  };

  useEffect(() => {
    nodes.current = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    measure();
    return () => {
      cancelAnimationFrame(frame.current);
      delete document.documentElement.dataset.chapter;
    };
  }, []);

  useMotionValueEvent(scrollY, "change", () => {
    if (!frame.current) frame.current = requestAnimationFrame(measure);
  });

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
