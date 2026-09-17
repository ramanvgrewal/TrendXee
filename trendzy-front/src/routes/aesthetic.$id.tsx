import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TrendCard } from "@/components/TrendCard";
import { Stamp } from "@/components/Stamp";
import type { Aesthetic, Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { getTrends } from "@/lib/api";

export const Route = createFileRoute("/aesthetic/$id")({
  loader: async ({ params }): Promise<{ aesthetic: Aesthetic; trends: Trend[] }> => {
    const aesthetic = aesthetics.find((a) => a.id === params.id);
    if (!aesthetic) throw notFound();

    let queryCategory = params.id;
    if (params.id === "upper") queryCategory = "tees";
    try {
      const allTrends = await getTrends(queryCategory, 100);
      // Strictly enforce category matching on the frontend to protect against loose backend responses
      const trends = allTrends.filter(t => t.aestheticId === queryCategory);
      return { aesthetic, trends };
    } catch (e) {
      console.error(e);
      return { aesthetic, trends: [] };
    }
  },
  head: ({ loaderData }) => {
    const aesthetic = loaderData?.aesthetic;
    const title = aesthetic
      ? `${aesthetic.name} trends on TrendXee`
      : "Lane — TrendXee";
    const description = aesthetic
      ? `${aesthetic.description}`
      : "A TrendXee lane of rising fits.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LanePage,
  errorComponent: () => (
    <Shell>
      <p className="hand text-xl text-clay">this page slipped off the board</p>
      <p className="mt-2 text-ink/70">Something went wrong loading this lane. Try again.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="hand text-xl text-clay">no such lane</p>
      <p className="mt-2 text-ink/70">That lane isn't pinned to the board.</p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay">
        <ArrowLeft className="size-4" /> Back to the board
      </Link>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const laneEmoji: Record<string, string> = {
  streetwear: "👕",
  upper: "🎽",
  sneakers: "👟",
  bottoms: "👖",
  caps: "🧢",
  sportswear: "💪",
  fragrances: "🧴",
};

function LanePage() {
  const { aesthetic, trends } = Route.useLoaderData() as {
    aesthetic: Aesthetic;
    trends: Trend[];
  };
  const emoji = laneEmoji[aesthetic.id] ?? "✦";

  return (
    <div className="pb-24">
      <header className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
          <Link
            to="/"
            hash="lanes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay"
          >
            <ArrowLeft className="size-4" /> All lanes
          </Link>

          <div className="mt-6 flex flex-col items-start gap-6">
            <div>
              <p className="hand text-lg text-clay">{emoji} lane</p>
              <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{aesthetic.name}</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink/75">
                {aesthetic.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4">
                <Stamp score={aesthetic.trendScore} size="lg" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/55">
                  lane score
                  <br />
                  {aesthetic.signalCount.toLocaleString("en-IN")} signals
                </p>
              </div>

              {aesthetic.vibeTags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 sm:border-l sm:border-border sm:pl-6">
                  {aesthetic.vibeTags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-input px-3 py-1 text-[11px] font-semibold text-ink/60"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] space-y-6 px-5 py-12 sm:px-8">
        <p className="hand text-lg text-clay">
          showing {trends.length} drops in this lane
        </p>
        {trends.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-cream/70 px-6 py-16 text-center ring-1 ring-border">
            <span className="text-xl">🔌</span>
            <div>
              <div className="font-display text-xl">Waiting for the backend</div>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
                Trends for this aesthetic will appear here once the TrendXee engine
                is wired up.
              </p>
            </div>
          </div>
        ) : (
          trends.map((t) => (
            <TrendCard key={t.id} trend={t} />
          ))
        )}
      </section>
    </div>
  );
}
