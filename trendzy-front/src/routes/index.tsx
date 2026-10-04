import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { StoryScene } from "@/components/home/StoryScene";
import { DailyFive } from "@/components/home/DailyFive";
import { LaneUniverse } from "@/components/home/LaneUniverse";
import { UnderdogStory } from "@/components/home/UnderdogStory";
import { EngineSection } from "@/components/home/EngineSection";
import { FinalCta } from "@/components/home/FinalCta";
import { ScrollProgress } from "@/motion/ScrollProgress";
import { fetchLaneRotations, LANE_STALE_TIME, pickDailyFive, type RotationItem } from "@/lib/lanes";

export const Route = createFileRoute("/")({
  loader: async () => {
    const rotationMap = await fetchLaneRotations();
    return { rotationMap, dailyFive: pickDailyFive(rotationMap) };
  },
  staleTime: LANE_STALE_TIME,
  head: () => ({
    meta: [
      { title: "TrendXee — Fits before they go viral" },
      {
        name: "description",
        content:
          "A scrapbook of India's rising fashion drops: bottoms, tees, outerwear, sneakers, sportswear, anime, polos, and caps, with the underdog brand behind each trend.",
      },
      { property: "og:title", content: "TrendXee — Fits before they go viral" },
      {
        property: "og:description",
        content:
          "Eight lanes of rising fits, read from real signals, with the indie brand behind each trend and where to buy it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

/**
 * Picks every module's products from the same loader data, so the server
 * render and the hydrated page always agree. Each product appears once.
 */
function castTheBoard(rotationMap: Record<string, RotationItem[]>, dailyFive: RotationItem[]) {
  const used = new Set(dailyFive.map((i) => i.id));
  const rest = Object.values(rotationMap)
    .flat()
    .filter((i) => i.image && !used.has(i.id));
  // Interleave lanes so neighbouring prints are visually different.
  const byLane = Object.values(rotationMap).map((items) => items.filter((i) => i.image && !used.has(i.id)));
  const interleaved: RotationItem[] = [];
  for (let round = 0; round < 5; round++) {
    for (const lane of byLane) if (lane[round]) interleaved.push(lane[round]);
  }
  const pool = interleaved.length ? interleaved : rest;

  const lead = dailyFive[0] ?? pool[0];
  const heroPrints = pool.slice(0, 2);
  const story = pool.slice(2, 9);
  const underdog =
    pool.slice(9).find((i) => i.mainstream?.image) ?? [...dailyFive, ...pool].find((i) => i.mainstream?.image);
  return { lead, heroPrints, story, underdog };
}

function Home() {
  const { rotationMap, dailyFive } = Route.useLoaderData();
  const { lead, heroPrints, story, underdog } = castTheBoard(rotationMap, dailyFive);

  return (
    <div className="relative">
      <ScrollProgress />
      <div data-chapter="01" data-chapter-title="The board">
        <Hero lead={lead} prints={heroPrints} />
      </div>
      {story.length >= 5 && (
        <div data-chapter="02" data-chapter-title="The story">
          <StoryScene items={story} />
        </div>
      )}
      <div data-chapter="03" data-chapter-title="Daily five">
        <DailyFive items={dailyFive} />
      </div>
      <div data-chapter="04" data-chapter-title="The lanes">
        <LaneUniverse rotationMap={rotationMap} />
      </div>
      {underdog && (
        <div data-chapter="05" data-chapter-title="Underdogs first">
          <UnderdogStory item={underdog} />
        </div>
      )}
      <div data-chapter="06" data-chapter-title="The engine">
        <EngineSection />
      </div>
      <div data-chapter="07" data-chapter-title="Start">
        <FinalCta />
      </div>
    </div>
  );
}
