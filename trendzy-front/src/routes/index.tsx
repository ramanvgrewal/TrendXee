import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shuffle } from "lucide-react";
import { useState } from "react";
import { LanePoster } from "@/components/LanePoster";
import { Photo } from "@/components/Photo";
import { aesthetics } from "@/lib/mock-data";
import { getTrends } from "@/lib/api";

export const Route = createFileRoute("/")({
  loader: async () => {
    const rotationMap: Record<string, { brand: string; title: string; image: string; shopUrl: string; category?: string }[]> = {};
    try {
      await Promise.all(
        aesthetics.map(async (a) => {
          let queryCategory = a.id;
          if (a.id === "upper") queryCategory = "tees";
          const trends = await getTrends(queryCategory, 15);
          rotationMap[a.id] = trends
            .filter((t) => t.products?.underdog?.imageUrl && t.products?.underdog?.shopUrl)
            .slice(0, 5) // Fetch top 5 per lane for a good mix
            .map((t) => ({
              brand: t.products.underdog?.brandName || "",
              title: t.products.underdog?.title || "",
              image: t.products.underdog?.imageUrl || "",
              shopUrl: t.products.underdog?.shopUrl || "",
              category: a.id,
            }));
        }),
      );
    } catch (e) {
      console.error("Failed to fetch rotations", e);
    }
    return { rotationMap };
  },
  head: () => ({
    meta: [
      { title: "TrendXee — Fits before they go viral" },
      {
        name: "description",
        content:
          "A scrapbook of India's rising fashion drops: streetwear, sneakers, tees, bottoms, caps, sportswear and fragrances, with the underdog brand behind each trend.",
      },
      { property: "og:title", content: "TrendXee — Fits before they go viral" },
      {
        property: "og:description",
        content:
          "Seven lanes of rising fits, scored by signal volume, with the indie brand behind each trend and where to buy it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const engineSteps = [
  {
    label: "01",
    title: "Listen",
    body: "We watch what people actually post, search and repost across social feeds, marketplaces and indie brand stores.",
  },
  {
    label: "02",
    title: "Cluster",
    body: "Related chatter is grouped into one drop — a single fit idea with the reasons it is climbing right now.",
  },
  {
    label: "03",
    title: "Score",
    body: "Each drop gets a trend score from signal volume, velocity and how shoppable it currently is.",
  },
  {
    label: "04",
    title: "Source",
    body: "We pin the underdog brand making it first, then the mainstream lookalikes, so you can choose either.",
  },
];

function Home() {
  const { rotationMap } = Route.useLoaderData();
  const [shuffleIndex, setShuffleIndex] = useState(0);

  // Combine all fetched products across all lanes
  const allProducts = Object.values(rotationMap).flat();

  // Create a daily seeded shuffle so it changes once per day
  const seed = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }

  const shuffledProducts = [...allProducts].sort((a, b) => {
    const hashA = (Math.imul(31, hash) + a.image.charCodeAt(0)) | 0;
    const hashB = (Math.imul(31, hash) + b.image.charCodeAt(0)) | 0;
    return hashA - hashB;
  });

  // Pick exactly 10 products for the day
  const dailyTen = shuffledProducts.slice(0, 10);

  const currentDrop =
    dailyTen.length > 0
      ? dailyTen[shuffleIndex % dailyTen.length]
      : { image: aesthetics[0].heroImage, shopUrl: "#", category: aesthetics[0].id };

  const isSneaker = currentDrop.category === "sneakers";

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid w-full gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <p className="hand text-lg text-clay">pinned this day</p>
            <h1 className="mt-3 font-display text-[2.75rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Fits before they
              <br />
              <em className="italic text-clay">Go Viral.</em>
            </h1>
            <div className="mt-6 max-w-xl space-y-5 text-[17px] leading-relaxed text-ink/75">
              <p>
                TrendXee tracks emerging fashion signals to give you a curated discovery experience.
              </p>
              <p>
                Find products you've never seen before and uncover the small brands hiding behind the trend. No endless searching—just discover what you didn't know you wanted.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShuffleIndex((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition-transform hover:-translate-y-0.5"
              >
                Shuffle Drop <Shuffle className="size-4" />
              </button>
              <Link
                to="/"
                hash="lanes"
                className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold transition-colors hover:border-clay hover:text-clay"
              >
                Explore in curated <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold transition-colors hover:border-clay hover:text-clay"
              >
                Why we built it
              </Link>
            </div>

          </div>

          {/* Single featured drop */}
          <div className="flex items-center justify-center lg:justify-end">
            <a
              href={currentDrop.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group animate-settle w-full max-w-lg overflow-hidden rounded-2xl bg-cream p-3 ring-1 ring-border transition-transform hover:z-10 hover:scale-[1.02] hover:shadow-xl"
              style={{ "--tilt": "1deg" } as React.CSSProperties}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-paper">
                {isSneaker && (
                  <img
                    src={currentDrop.image}
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
                  />
                )}
                <Photo
                  key={currentDrop.image}
                  src={currentDrop.image}
                  alt="Trend drop"
                  className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04] ${
                    isSneaker ? "z-10 object-contain p-4" : "object-cover"
                  }`}
                />
                {/* Subtle overlay on hover indicating it's clickable */}
                <div className="absolute inset-0 z-20 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Lanes */}
      <section id="lanes" className="mx-auto w-full scroll-mt-20 px-5 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45">
              the collection
            </p>
            <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              Curated <em className="italic text-clay">lanes</em>.
            </h2>
          </div>
          <Link
            to="/lanes"
            className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-[12px] font-bold uppercase tracking-[0.18em] transition-colors hover:border-clay hover:text-clay"
          >
            view all lanes <ArrowRight className="size-4 -rotate-45" />
          </Link>
        </div>

        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
          {aesthetics.map((aesthetic, index) => (
            <LanePoster
              key={aesthetic.id}
              aesthetic={aesthetic}
              index={index}
              rotationImages={rotationMap?.[aesthetic.id] || []}
              heroOverride={rotationMap?.[aesthetic.id]?.[0]?.image}
              className="w-[260px] sm:w-[280px]"
            />
          ))}
        </div>
      </section>

      {/* Engine */}
      <section
        id="engine"
        className="mx-auto w-full scroll-mt-20 border-t border-border px-5 py-16 sm:px-8"
      >
        <p className="hand text-lg text-clay">how the engine works</p>
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Noise in, one honest drop out
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {engineSteps.map((step, index) => (
            <li
              key={step.label}
              className="animate-settle rounded-2xl bg-cream/70 p-5 ring-1 ring-border"
              style={{ "--tilt": index % 2 === 0 ? "0.6deg" : "-0.6deg" } as React.CSSProperties}
            >
              <span className="hand text-2xl text-clay">{step.label}</span>
              <h3 className="mt-1 font-display text-xl tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
