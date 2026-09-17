import { createFileRoute } from "@tanstack/react-router";
import { LanePoster } from "@/components/LanePoster";
import { aesthetics } from "@/lib/mock-data";
import { getTrends } from "@/lib/api";

export const Route = createFileRoute("/lanes")({
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
            .slice(0, 5)
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
      { title: "All lanes — TrendXee" },
      {
        name: "description",
        content:
          "Every TrendXee lane in one place: streetwear, sneakers, tees, bottoms, caps, sportswear and fragrances, each scored by live signal volume.",
      },
      { property: "og:title", content: "All lanes — TrendXee" },
      {
        property: "og:description",
        content: "Seven scored lanes of rising Indian fashion drops, with the underdog brand behind each.",
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
    <div className="mx-auto w-full px-5 py-16 sm:px-8">
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
