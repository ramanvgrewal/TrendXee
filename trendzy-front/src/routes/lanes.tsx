import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LanePoster } from "@/components/LanePoster";
import { aesthetics } from "@/lib/mock-data";
import { fetchLaneRotations, LANE_STALE_TIME } from "@/lib/lanes";

export const Route = createFileRoute("/lanes")({
  loader: async () => ({ rotationMap: await fetchLaneRotations() }),
  staleTime: LANE_STALE_TIME,
  head: () => ({
    meta: [
      { title: "All lanes — TrendXee" },
      {
        name: "description",
        content:
          "Every TrendXee lane in one place: bottoms, tees, outerwear, sneakers, sportswear, anime, polos, and caps, each scored by live signal volume.",
      },
      { property: "og:title", content: "All lanes — TrendXee" },
      {
        property: "og:description",
        content: "Nine scored lanes of rising Indian fashion drops, with the underdog brand behind each.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LanesPage,
});

function LanesPage() {
  const { rotationMap } = Route.useLoaderData();
  const totalSignals = aesthetics.reduce((sum, a) => sum + a.signalCount, 0);

  return (
    <div className="mx-auto w-full px-5 py-8 sm:px-8">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Previous
      </Link>

      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45">the collection</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
        All <em className="italic text-clay">lanes</em>.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/70">
        {totalSignals.toLocaleString("en-IN")} signals read across all live drops. Open a
        lane to read its drops, the reasons behind them, and the brands making them.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {aesthetics.map((aesthetic, index) => (
          <LanePoster
            key={aesthetic.id}
            aesthetic={aesthetic}
            index={index}
            rotationImages={rotationMap?.[aesthetic.id] || []}
            heroOverride={rotationMap?.[aesthetic.id]?.[0]?.image}
            className="w-full"
          />
        ))}
      </div>
    </div>
  );
}
