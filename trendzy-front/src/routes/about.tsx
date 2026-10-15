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
        content: "Indie fashion labels audited for trust, scored for real Instagram hype, and backed before they go viral.",
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
    body: "When an indie label drops heat, we show who made it first, how their trust metrics stack up, and where to buy. No vague mood boards, no paywalls.",
  },
  {
    title: "Underdogs first",
    body: "Small Indian labels usually make a fit before the big names copy it. Every drop leads with that brand, then shows the mainstream lookalikes so the choice is yours.",
  },
  {
    title: "Straight to the store",
    body: "Every product here links to the brand's own official store or verified marketplace listing. Nothing is marked up or resold through us.",
  },
  {
    title: "Audited, not guessed",
    body: "We audit each indie label's trust signals (COD, verified buyer reviews) and track their Instagram momentum to calculate real Brand Hype. No sponsored fluff.",
  },
];

const howTo = [
  "Pick the lane closest to your wardrobe — jeans, bottoms, tees, outerwear, sneakers, sportswear, anime, polos, or caps & accessories.",
  "Check the Brand Hype and 5-Star Trust badges to verify Instagram momentum and verified legitimacy before you buy.",
  "Open a drop to review community feedback, check Instagram metrics, and compare the indie original against the mainstream lookalike.",
  "Save the ones you like to your archive, leave your own brand review, or buy directly from the underdog.",
];

/** About is a reading page: calm type, almost no motion. */
function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <p className="enter-fade eyebrow text-ink/70">About TrendXee</p>
      <h1 className="mt-4 max-w-5xl text-balance font-display text-[clamp(2.6rem,5.4vw,5.25rem)] leading-[1] tracking-[-0.035em]">
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

      <section className="fibre mt-28 grid gap-10 rounded-[28px] bg-cream/60 p-8 ring-1 ring-border sm:p-12 lg:grid-cols-12 lg:p-16">
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
