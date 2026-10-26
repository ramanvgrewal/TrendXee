import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { StoryScene } from "@/components/home/StoryScene";
import { DailyFive } from "@/components/home/DailyFive";
import { LaneUniverse } from "@/components/home/LaneUniverse";
import { UnderdogStory } from "@/components/home/UnderdogStory";
import { EngineSection } from "@/components/home/EngineSection";
import { FinalCta } from "@/components/home/FinalCta";
import { ScrollProgress } from "@/motion/ScrollProgress";
import { fetchLaneRotations } from "@/lib/lanes";
import { buildDailyBoard, indiaDateKey, untilNextIndiaDay } from "@/lib/daily-board";
import { normalizeAudienceFilter } from "@/lib/audience";

export const Route = createFileRoute("/")({
  loaderDeps: ({ search }) => ({ audience: normalizeAudienceFilter(search.audience) }),
  loader: async ({ deps }) => {
    const rotationMap = await fetchLaneRotations(deps.audience);
    const dateKey = indiaDateKey();
    return { rotationMap, dateKey, ...buildDailyBoard(rotationMap, dateKey) };
  },
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "TrendXee — Fits before they go viral" },
      {
        name: "description",
        content:
          "A scrapbook of India's rising fashion drops: jeans, bottoms, tees, outerwear, shoes, sportswear, anime, polos & regular, and caps & accessories, with the underdog brand behind each trend.",
      },
      { property: "og:title", content: "TrendXee — Fits before they go viral" },
      {
        property: "og:description",
        content:
          "Nine lanes of rising fits audited for trust and Instagram hype, with the indie brand behind each trend and where to buy it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { audience = "ALL" } = Route.useSearch();
  const { rotationMap, dateKey, dailyFive, lead, story, underdog } = Route.useLoaderData();
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && indiaDateKey() !== dateKey) {
        void router.invalidate({ filter: (match) => match.routeId === Route.id });
      }
    };
    const timer = window.setTimeout(refresh, untilNextIndiaDay() + 100);
    refresh(); // A server render can finish just before midnight and hydrate just after it.
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [dateKey, router]);

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
      {underdog && (
        <div data-chapter="05" data-chapter-title="Underdogs first" className="py-10 lg:py-16">
          <UnderdogStory item={underdog} />
        </div>
      )}
      <div data-chapter="06" data-chapter-title="The engine">
        <EngineSection />
      </div>
      <div data-chapter="07" data-chapter-title="Start" className="tone-cta">
        <FinalCta rotationMap={rotationMap} />
      </div>
    </div>
  );
}
