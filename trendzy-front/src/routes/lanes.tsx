import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { LaneCard } from "@/components/LaneCard";
import { ScrollReveal } from "@/motion/ScrollReveal";
import { aesthetics } from "@/lib/mock-data";
import { fetchLaneRotations, LANE_STALE_TIME } from "@/lib/lanes";
import { normalizeAudienceFilter } from "@/lib/audience";

export const Route = createFileRoute("/lanes")({
  loaderDeps: ({ search }) => ({ audience: normalizeAudienceFilter(search.audience) }),
  loader: async ({ deps }) => ({ rotationMap: await fetchLaneRotations(deps.audience) }),
  staleTime: LANE_STALE_TIME,
  head: () => pageSeo({ title: "All nine fashion lanes — TrendXee", description: "Browse tees, outerwear, jeans, bottoms, anime, shoes, sportswear, polos & regular and accessories from Indian fashion brands.", path: "/lanes" }),
  component: LanesPage,
});

function LanesPage() {
  const { rotationMap } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="enter-fade eyebrow text-ink/70">The collection</p>
          <h1 className="h-page mt-4 overflow-hidden pb-[0.1em]">
            <span className="enter-line block">
              Every <em className="italic text-clay">lane.</em>
            </span>
          </h1>
        </div>
        <p className="enter-fade lede max-w-md lg:col-span-4" style={{ "--d": "200ms" } as React.CSSProperties}>
          Nine worlds, each read from what people are posting right now. Open one to see its drops, why they're
          climbing, and the small brands making them first.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
