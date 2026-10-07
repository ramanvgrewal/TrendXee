import { createFileRoute, Link } from "@tanstack/react-router";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { ScrollReveal } from "@/motion/ScrollReveal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TrendXee — no gatekeeping, just the underdogs" },
      {
        name: "description",
        content:
          "Why TrendXee exists: spot rising Indian fashion trends early, credit the small brands making them first, and send you straight to the official store.",
      },
      { property: "og:title", content: "About TrendXee" },
      {
        property: "og:description",
        content: "Trends read from real signals, underdog brands credited first, and links straight to the official store.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const notes = [
  {
    title: "No gatekeeping",
    body: "When something is rising, we say what it is, why it is climbing and where to get it. No vague mood boards, no paywall on the answer.",
  },
  {
    title: "Underdogs first",
    body: "Small Indian labels usually make a fit before the big names copy it. Every drop leads with that brand, then shows the mainstream lookalikes so the choice is yours.",
  },
  {
    title: "Straight to the store",
    body: "Every product here links to the brand's own store or the marketplace listing. Nothing is resold through us and no step is added in between.",
  },
  {
    title: "Signals, not guesses",
    body: "We read what people post and search to pin the drops currently on the board across all lanes. Scores move as the chatter moves.",
  },
];

const howTo = [
  "Pick the lane closest to your wardrobe — bottoms, tees, outerwear, sneakers, sportswear, anime, polos, or caps.",
  "Read the drops from the top; the trend score tells you how hot each one is right now.",
  "Open a drop and check why it's climbing before you buy, so you know whether it has legs.",
  "Save the ones you like to your archive, then buy from the underdog or the mainstream pick.",
];

/** About is a reading page: calm type, almost no motion. */
function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <p className="enter-fade eyebrow text-ink/70">About TrendXee</p>
      <h1 className="mt-4 max-w-5xl font-display text-[clamp(2.8rem,6.4vw,6.2rem)] leading-[0.98] tracking-[-0.035em]">
        <span className="enter-fade block" style={{ "--d": "60ms" } as React.CSSProperties}>
          We find the fits before they go viral —{" "}
          <em className="italic text-clay">and name who made them first.</em>
        </span>
      </h1>

      <div className="rule mt-16" />

      <div className="mt-16 grid gap-x-16 gap-y-14 md:grid-cols-2">
        {notes.map((note, i) => (
          <ScrollReveal key={note.title} index={i}>
            <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-clay">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-3 font-display text-[2.2rem] leading-tight tracking-tight">{note.title}</h2>
            <p className="mt-3 max-w-lg text-[17px] leading-relaxed text-ink/70">{note.body}</p>
          </ScrollReveal>
        ))}
      </div>

      <section className="mt-28 grid gap-10 rounded-[28px] bg-cream/60 p-8 ring-1 ring-border sm:p-12 lg:grid-cols-12 lg:p-16">
        <div className="lg:col-span-4">
          <p className="hand text-xl text-clay-ink">how to use it</p>
          <h2 className="mt-2 font-display text-4xl leading-tight tracking-tight">Four steps, no noise.</h2>
        </div>
        <ol className="space-y-6 lg:col-span-8">
          {howTo.map((step, i) => (
            <li key={step} className="flex gap-6 border-b border-border pb-6 last:border-0 last:pb-0">
              <span className="font-display text-3xl italic leading-none text-clay">{i + 1}</span>
              <p className="text-[17px] leading-relaxed text-ink/75">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-16 flex flex-wrap items-center gap-6">
        <Cta magnetic>
          <Link to="/lanes" className={ctaClass("primary", "lg")}>
            Start with the lanes <CtaArrow />
          </Link>
        </Cta>
        <Link to="/" hash="engine" className="hit ed-link-rest text-sm font-semibold text-ink/75 hover:text-clay">
          How the engine works
        </Link>
      </div>
    </div>
  );
}
