import { createFileRoute } from "@tanstack/react-router";
import { LaneCard } from "@/components/LaneCard";
import { ScrollReveal } from "@/motion/ScrollReveal";
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
          "Every TrendXee lane in one place: bottoms, tees, outerwear, sneakers, sportswear, anime, polos, and caps, each read from live signals.",
      },
      { property: "og:title", content: "All lanes — TrendXee" },
      {
        property: "og:description",
        content: "Eight lanes of rising Indian fashion drops, with the underdog brand behind each.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LanesPage,
});

function LanesPage() {
  const { rotationMap } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="enter-fade eyebrow text-ink/70">The collection</p>
          <h1 className="mt-3 overflow-hidden pb-[0.1em] font-display text-[clamp(3.2rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.04em]">
            <span className="enter-line block">
              Every <em className="italic text-clay">lane.</em>
            </span>
          </h1>
        </div>
        <p className="enter-fade max-w-md text-[16px] leading-relaxed text-ink/70 lg:col-span-4" style={{ "--d": "200ms" } as React.CSSProperties}>
          Eight worlds, each read from what people are posting right now. Open one to see its drops, why they're
          climbing, and the small brands making them first.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {aesthetics.map((aesthetic, i) => {
          const first = rotationMap?.[aesthetic.id]?.[0];
          return (
            <ScrollReveal key={aesthetic.id} index={i}>
              <LaneCard
                aesthetic={aesthetic}
                index={i}
                image={first?.image}
                brand={first?.brand}
                eager={i < 3}
                className="h-[min(72svh,560px)]"
              />
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
