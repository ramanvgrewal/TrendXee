import { pageSeo } from "@/lib/seo";
import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { StoryScene } from "@/components/home/StoryScene";
import { DailyFive } from "@/components/home/DailyFive";
import { LaneUniverse } from "@/components/home/LaneUniverse";
import { EngineSection } from "@/components/home/EngineSection";
import { FinalCta } from "@/components/home/FinalCta";
import { ScrollProgress } from "@/motion/ScrollProgress";
import { fetchLaneRotations, LANE_COVER_STALE_TIME } from "@/lib/lanes";
import { buildDailyBoard, indiaDateKey, untilNextIndiaDay } from "@/lib/daily-board";
import { normalizeAudienceFilter } from "@/lib/audience";

export const Route = createFileRoute("/")({
  loaderDeps: ({ search }) => ({ audience: normalizeAudienceFilter(search.audience) }),
  loader: async ({ deps }) => {
    const rotationMap = await fetchLaneRotations(deps.audience);
    const dateKey = indiaDateKey();
    return { rotationMap, dateKey, loadedAt: Date.now(), ...buildDailyBoard(rotationMap, dateKey) };
  },
  staleTime: 0,
  head: () => pageSeo({ title: "TrendXee — Discover Fashion Trends & Indian Indie Brands", description: "Discover fashion trends and emerging Indian indie brands on TrendXee. Explore oversized tees, baggy jeans, streetwear and fresh drops from the labels behind them.", path: "/" }),
  component: Home,
});

function Home() {
  const { audience = "ALL" } = Route.useSearch();
  const { rotationMap, dateKey, dailyFive, lead, story, loadedAt } = Route.useLoaderData();
  const router = useRouter();
  useEffect(() => {
    let refreshing = false;
    const refresh = () => {
      const stale = Date.now() - loadedAt >= LANE_COVER_STALE_TIME || indiaDateKey() !== dateKey;
      if (document.visibilityState !== "visible" || !stale || refreshing) return;
      refreshing = true;
      void router.invalidate({ filter: (match) => match.routeId === Route.id })
        .finally(() => { refreshing = false; });
    };
    const timer = window.setTimeout(refresh, untilNextIndiaDay() + 100);
    refresh(); // A server render can finish just before midnight and hydrate just after it.
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [dateKey, loadedAt, router]);

  return (
    <div key={audience} className="relative">
      <ScrollProgress />
      <div data-chapter="01" data-chapter-title="The board" className="tone-hero -mt-16 pt-16">
        <Hero key={dateKey} lead={lead} dateKey={dateKey} />
      </div>
      {story.length >= 5 && (
        <div data-chapter="02" data-chapter-title="The story" className="tone-deep">
          <StoryScene items={story} />
        </div>
      )}
      <div data-chapter="03" data-chapter-title="Daily five" className="tone-raised">
        <DailyFive key={`${dateKey}-${dailyFive.map((item) => item.id).join("-")}`} items={dailyFive} />
      </div>
      <div data-chapter="04" data-chapter-title="The lanes" className="tone-lanes">
        <LaneUniverse rotationMap={rotationMap} />
      </div>
      <div data-chapter="05" data-chapter-title="The engine">
        <EngineSection />
      </div>
      <div data-chapter="06" data-chapter-title="Start" className="tone-cta">
        <FinalCta rotationMap={rotationMap} />
      </div>
    </div>
  );
}
