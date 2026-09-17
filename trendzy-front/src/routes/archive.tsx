import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { TrendCard } from '@/components/TrendCard';
import { getArchivedTrends } from '@/lib/archiveApi';
import type { Trend } from '@/lib/mock-data';

export const Route = createFileRoute('/archive')({
  head: () => ({
    meta: [
      { title: "Your archive — TrendXee" },
      {
        name: "description",
        content:
          "The trend drops you pinned to your own TrendXee board, with the brands and links kept alongside them.",
      },
      { property: "og:title", content: "Your archive — TrendXee" },
      {
        property: "og:description",
        content: "Trend drops you pinned to your own TrendXee board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const [archivedTrends, setArchivedTrends] = useState<{ id: string; trendSnapshot: Trend }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchive = async () => {
    try {
      setLoading(true);
      const data = await getArchivedTrends();
      setArchivedTrends(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load archived trends.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleUnarchive = () => {
    fetchArchive();
  };

  return (
    <div className="mx-auto w-full px-5 py-14 sm:px-8">
      <p className="hand text-lg text-clay">your corner of the board</p>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Archive</h1>

      {/* Warning Banner */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-cream/70 p-4 ring-1 ring-border">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-clay" />
        <div className="text-sm leading-relaxed text-ink/75">
          Unarchiving a trend will permanently remove it from here. If it is no longer in the main feed, it will be gone forever.
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="rounded-full bg-cream/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink/50 ring-1 ring-border">
          {archivedTrends.length} saved
        </span>
      </div>

      {loading ? (
        <p className="mt-8 text-ink/60">Opening your archive…</p>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-cream/70 p-6 ring-1 ring-border text-center">
          <p className="text-ink/75">{error}</p>
          <button onClick={fetchArchive} className="mt-4 text-sm font-semibold text-clay underline hover:no-underline">
            Try again
          </button>
        </div>
      ) : archivedTrends.length === 0 ? (
        <div className="mt-8 max-w-lg rounded-2xl bg-cream/70 p-6 ring-1 ring-border">
          <p className="text-ink/75">
            Nothing pinned yet. Tap the bookmark on any drop and it lands here.
          </p>
          <Link
            to="/"
            hash="lanes"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-sand"
          >
            Browse the lanes <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {archivedTrends.map((item) => (
            <TrendCard
              key={item.id}
              trend={item.trendSnapshot}
              isArchivedContext={true}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
