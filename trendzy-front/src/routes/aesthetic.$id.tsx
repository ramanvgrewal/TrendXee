import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { TrendCard } from "@/components/TrendCard";

import type { Aesthetic, Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { fetchLanePage, LANE_STALE_TIME } from "@/lib/lanes";

export const Route = createFileRoute("/aesthetic/$id")({
  loader: async ({ params }): Promise<{ aesthetic: Aesthetic; trends: Trend[]; hasMore: boolean }> => {
    const aesthetic = aesthetics.find((a) => a.id === params.id);
    if (!aesthetic) throw notFound();

    try {
      // First page only; the rest loads on demand (backend sorts by score).
      const { trends, hasMore } = await fetchLanePage(params.id, 0);
      return { aesthetic, trends, hasMore };
    } catch (e) {
      console.error(e);
      return { aesthetic, trends: [], hasMore: false };
    }
  },
  staleTime: LANE_STALE_TIME,
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
    <div className="mx-auto w-full px-5 py-20 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay">
        <ArrowLeft className="size-4" /> Back to the board
      </Link>
      <div className="mt-6">{children}</div>
    </div>
  );
}



function LanePage() {
  const { aesthetic, trends, hasMore } = Route.useLoaderData() as {
    aesthetic: Aesthetic;
    trends: Trend[];
    hasMore: boolean;
  };

  return (
    <div className="pb-24">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-6 px-5 py-6 sm:px-8">
          <Link
            to="/"
            hash="lanes"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-clay transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Previous
          </Link>

          <nav className="flex flex-wrap items-center gap-4 sm:gap-6">
            {aesthetics.map((a) => (
              <Link
                key={a.id}
                to="/aesthetic/$id"
                params={{ id: a.id }}
                className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${
                  a.id === aesthetic.id
                    ? "text-ink border-b-2 border-clay pb-1"
                    : "text-ink/40 hover:text-ink"
                }`}
              >
                {a.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Keyed by lane so switching lanes resets the loaded pages. */}
      <LaneFeed key={aesthetic.id} laneId={aesthetic.id} initialTrends={trends} initialHasMore={hasMore} />
    </div>
  );
}

function LaneFeed({
  laneId,
  initialTrends,
  initialHasMore,
}: {
  laneId: string;
  initialTrends: Trend[];
  initialHasMore: boolean;
}) {
  const [trends, setTrends] = useState(initialTrends);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    setError(false);
    try {
      const next = await fetchLanePage(laneId, page + 1);
      setTrends((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...next.trends.filter((t) => !seen.has(t.id))];
      });
      setHasMore(next.hasMore);
      setPage((p) => p + 1);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full space-y-6 px-5 py-12 sm:px-8">
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
        trends.map((t) => <TrendCard key={t.id} trend={t} />)
      )}

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold transition-colors hover:border-clay hover:text-clay disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Loading drops…" : "Load more drops"}
          </button>
          {error && <p className="text-sm text-ink/60">Couldn't load more. Try again.</p>}
        </div>
      )}
    </section>
  );
}
