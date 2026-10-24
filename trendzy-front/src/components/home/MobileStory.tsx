import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { m, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Img } from "@/components/Img";
import { useMediaQuery } from "@/motion/hooks";
import type { RotationItem } from "@/lib/lanes";

const CHAPTERS = [
  { label: "Discover", heading: <>The internet moves fast.<br /><em>Trends move faster.</em></>, detail: "Fresh finds. Independent labels. There’s more to the feed than the familiar names." },
  { label: "Look closer", heading: <>Beyond the buzz.<br /><em>Closer to the brand.</em></>, detail: "Instagram hype, brand reviews and product details. A clearer picture before you shop." },
  { label: "Back indie", heading: <>Small labels.<br /><em>Your next big find.</em></>, detail: "Meet the underdogs behind the fits. Start with this one from today’s board." },
];
const chapterAt = (progress: number) => progress < .34 ? 0 : progress < .67 ? 1 : 2;

/** A short touch-first story: plain page scrolling fans the prints into one pick. */
export function MobileStory({ products, chosen, reduced }: { products: RotationItem[]; chosen?: RotationItem; reduced: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const shortScreen = useMediaQuery("(max-height: 680px)");
  const still = reduced || shortScreen;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 64px", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!still) setChapter((current) => current === chapterAt(progress) ? current : chapterAt(progress));
  });
  const leftX = useTransform(scrollYProgress, [0, .5, .85], [-58, -38, -20]);
  const rightX = useTransform(scrollYProgress, [0, .5, .85], [58, 38, 20]);
  const leftRotate = useTransform(scrollYProgress, [0, .55, .85], [-14, -7, -3]);
  const rightRotate = useTransform(scrollYProgress, [0, .55, .85], [13, 6, 3]);
  const sideOpacity = useTransform(scrollYProgress, [0, .4, .75], [.85, .55, 0]);
  const frontRotate = useTransform(scrollYProgress, [0, .45, .8], [-3, 2, 0]);
  const frontScale = useTransform(scrollYProgress, [0, .7, 1], [.94, 1, 1.025]);
  const frontY = useTransform(scrollYProgress, [0, .8], [8, -2]);
  const sideProducts = products.filter((item) => item.id !== chosen?.id).slice(0, 2);
  const current = CHAPTERS[chapter];

  const selectChapter = (index: number) => {
    const section = sectionRef.current;
    if (!section || still) { setChapter(index); return; }
    const top = section.getBoundingClientRect().top + window.scrollY - 64;
    const travel = section.offsetHeight - window.innerHeight + 64;
    window.scrollTo({ top: top + Math.max(0, travel) * [.12, .5, .86][index], behavior: "smooth" });
  };

  const navigation = <div className="mobile-story-navigation">
    <div aria-hidden className="mb-1.5 h-px overflow-hidden bg-ink/10">
      <m.div className="h-full origin-left bg-clay" style={still ? { scaleX: (chapter + 1) / 3 } : { scaleX: scrollYProgress }} />
    </div>
    <div className="grid grid-cols-3 gap-1" role="group" aria-label="Story chapters">
      {CHAPTERS.map((step, index) => <button key={step.label} type="button" aria-pressed={chapter === index} onClick={() => selectChapter(index)}
        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full text-[10px] font-semibold transition-colors ${chapter === index ? "bg-ink text-paper" : "text-ink/55 hover:bg-ink/5"}`}>
        <span className={`font-mono text-[9px] ${chapter === index ? "text-paper/60" : "text-clay-ink"}`}>0{index + 1}</span>{step.label}
      </button>)}
    </div>
  </div>;

  return (
    <section ref={sectionRef} id="story" data-mobile-story data-chapter-index={chapter} aria-label="The TrendXee story"
      className={`mobile-story relative md:hidden ${still ? "mobile-story-still" : ""}`}>
      <div className="sr-only">{CHAPTERS.map((step) => <p key={step.label}>{step.heading} {step.detail}</p>)}</div>
      <div className="mobile-story-stage">
        <div className="mobile-story-topline flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.16em] text-ink/60">
          <span><span className="text-clay-ink">02</span> / Behind the finds</span>
          <span className="flex shrink-0 items-center gap-1.5">{still ? "Tap to explore" : "Scroll"}<ArrowDown className="size-3" aria-hidden /></span>
        </div>

        {still && navigation}

        <div aria-hidden className="mobile-story-heading grid place-items-center text-center">
          <m.h2 key={chapter} initial={still ? false : { opacity: .4, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}
            className="font-display text-[clamp(1.75rem,7.7vw,2.9rem)] leading-[1.08] tracking-[-.035em] [&_em]:text-clay-ink">
            {current.heading}
          </m.h2>
        </div>

        <div className="mobile-story-art relative isolate flex min-h-0 items-center justify-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--clay)_15%,transparent),transparent_70%)]" />
          {sideProducts.map((item, index) => <m.div key={item.id} aria-hidden
            style={still ? { x: index ? 36 : -36, rotate: index ? 9 : -10, opacity: .5 } : { x: index ? rightX : leftX, rotate: index ? rightRotate : leftRotate, opacity: sideOpacity }}
            className="mobile-story-print pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-2xl border border-border bg-cream p-1.5 shadow-print">
            <Img src={item.image} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
          </m.div>)}
          {chosen && <m.div style={still ? undefined : { rotate: frontRotate, scale: frontScale, y: frontY }} className="mobile-story-print relative z-10">
            <Link to="/aesthetic/$id" params={{ id: chosen.category || "tees" }} search={{ trend: chosen.id }}
              aria-label={`Explore ${chosen.title} by ${chosen.brand}`} className="group block rounded-2xl border border-border bg-raised p-1.5 shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay">
              <div className="relative overflow-hidden rounded-xl">
                <Img src={chosen.image} alt={chosen.title} eager fallbackLabel={chosen.brand} className="aspect-[4/5] w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-paper/95 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-ink">On today’s board</span>
              </div>
              <div className="flex min-h-11 items-center justify-between gap-2 px-2 py-2">
                <span className="min-w-0"><span className="block truncate font-display text-[15px] italic leading-tight">{chosen.brand}</span><span className="mt-0.5 block text-[9px] text-ink/60">Explore the drop</span></span>
                <ArrowUpRight className="size-4 shrink-0 text-clay-ink" aria-hidden />
              </div>
            </Link>
          </m.div>}
        </div>

        <p aria-hidden className="mobile-story-detail mx-auto max-w-[32ch] text-center text-[13px] leading-relaxed text-ink/70">{current.detail}</p>

        {!still && navigation}
      </div>
    </section>
  );
}
