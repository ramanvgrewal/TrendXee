import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendBoard } from "@/components/TrendBoard";
import { AuthModal } from "@/components/AuthModal";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { getArchivedTrends } from "@/lib/archiveApi";
import type { Trend } from "@/lib/mock-data";
import { currentUserQuery } from "@/lib/user";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Your archive — TrendXee" },
      {
        name: "description",
        content: "The trend drops you pinned to your own TrendXee board, with the brands and links kept alongside them.",
      },
      { property: "og:title", content: "Your archive — TrendXee" },
      { property: "og:description", content: "Trend drops you pinned to your own TrendXee board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArchivePage,
});

type Archived = { id: string; trendSnapshot: Trend };

function ArchivePage() {
  const { data: user, isLoading: isUserLoading } = useQuery(currentUserQuery);
  const isAuthenticated = !!user;
  const [items, setItems] = useState<Archived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchArchive = async () => {
    try {
      setLoading(true);
      setError(false);
      setItems(await getArchivedTrends());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchArchive();
  }, [isAuthenticated]);

  const trends = items.map((i) => i.trendSnapshot);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="enter-fade eyebrow text-ink/70">Your corner of the board</p>
          <h1 className="h-page mt-4 overflow-hidden pb-[0.1em]">
            <span className="enter-line block">
              The <em className="italic text-clay">archive.</em>
            </span>
          </h1>
        </div>
        {isAuthenticated && !loading && !error && trends.length > 0 && (
          <p className="meta">
            {trends.length} saved {trends.length === 1 ? "drop" : "drops"}
          </p>
        )}
      </div>

      <div className="mt-14">
        {isUserLoading || (isAuthenticated && loading) ? (
          <ArchiveSkeleton />
        ) : !isAuthenticated ? (
          <Notice
            title="Sign in to keep a board of your own."
            body="Save drops from any lane and come back to them whenever you like."
            steps
            action={
              <Cta magnetic>
                <button type="button" onClick={() => setAuthOpen(true)} className={ctaClass("primary", "lg")}>
                  Sign in
                </button>
              </Cta>
            }
          />
        ) : error ? (
          <Notice
            title="Your archive didn't load."
            body="We couldn't reach your saved drops just now. They're safe — try again in a moment."
            action={
              <button type="button" onClick={fetchArchive} className={ctaClass("primary")}>
                Try again
              </button>
            }
          />
        ) : trends.length === 0 ? (
          <Notice
            title="Nothing pinned yet."
            body="Start with a lane that's close to your wardrobe and save what catches your eye."
            steps
            action={
              <Link to="/lanes" className={ctaClass("primary", "lg")}>
                Browse the lanes <CtaArrow />
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-10 max-w-2xl text-[14px] leading-relaxed text-ink/70">
              Saved drops stay here even after they leave the live feed. Removing one is permanent if it's no longer on
              the board.
            </p>
            <TrendBoard
              trends={trends}
              openId={openId}
              onOpenChange={setOpenId}
              archivedContext
              onUnarchived={(id) => {
                setOpenId(null);
                setItems((prev) => prev.filter((i) => i.trendSnapshot.id !== id));
              }}
            />
          </>
        )}
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

const SAVING_STEPS = [
  "Tap the bookmark on any drop.",
  "It lands here with the brand and shop links.",
  "It stays, even after it leaves the live feed.",
];

function Notice({
  title,
  body,
  action,
  steps = false,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
  /** Show how saving works beside the message. */
  steps?: boolean;
}) {
  return (
    <div className="fibre grid gap-12 rounded-[28px] bg-raised px-6 py-14 ring-1 ring-border sm:px-12 sm:py-16 lg:grid-cols-12 lg:px-16">
      <div className={steps ? "lg:col-span-7" : "lg:col-span-9"}>
        <h2 className="max-w-xl font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-tight">{title}</h2>
        <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-ink/70">{body}</p>
        <div className="mt-8">{action}</div>
      </div>
      {steps && (
        <div className="self-center lg:col-span-5">
          <p className="hand text-xl text-clay-ink">how saving works</p>
          <ol className="mt-3">
            {SAVING_STEPS.map((step, i) => (
              <li key={step} className="flex gap-5 border-t border-border py-4 last:pb-0">
                <span className="font-display text-2xl italic leading-none text-clay">{i + 1}</span>
                <p className="text-[15px] leading-relaxed text-ink/75">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ArchiveSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading your archive">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-[20px] bg-raised shadow-card">
          <div className="skeleton aspect-[4/5]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 skeleton rounded-full" />
            <div className="h-6 w-4/5 skeleton rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
