import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { aesthetics } from "@/lib/mock-data";

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
        content:
          "Trends read from real signals, underdog brands credited first, and links straight to the official store.",
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
    body: "We read thousands of signals to pin the drops currently on the board across all lanes. Scores move as the chatter moves.",
  },
];

const howTo = [
  "Pick the lane closest to your wardrobe — streetwear, sneakers, tees, bottoms, caps, sportswear or fragrances.",
  "Read the drops from the top; the trend score tells you how hot each one is right now.",
  "Check 'why it's trending' before you buy, so you know whether it has legs.",
  "Bookmark the ones you like into your archive, then buy from the underdog or the mainstream pick.",
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
      <p className="hand text-lg text-clay">about</p>
      <h1 className="max-w-3xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        We find the fits before they go viral — and name who made them first.
      </h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {notes.map((note, index) => (
          <section
            key={note.title}
            className="animate-settle rounded-2xl bg-cream/70 p-6 ring-1 ring-border"
            style={{ "--tilt": index % 2 === 0 ? "-0.6deg" : "0.6deg" } as React.CSSProperties}
          >
            <h2 className="font-display text-2xl tracking-tight">{note.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{note.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <p className="hand text-lg text-clay">how to use TrendXee</p>
        <ol className="mt-4 max-w-3xl space-y-3">
          {howTo.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-xl bg-paper p-4 ring-1 ring-border">
              <span className="hand text-2xl text-clay">{index + 1}</span>
              <p className="text-[15px] leading-relaxed text-ink/75">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <Link
        to="/"
        hash="lanes"
        className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand"
      >
        Start with the lanes <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
