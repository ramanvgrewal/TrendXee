import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { TrendBoard } from "@/components/TrendBoard";
import { trendImage } from "@/components/TrendCard";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { spring } from "@/motion/tokens";
import type { Aesthetic, Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { fetchLanePage, LANE_STALE_TIME } from "@/lib/lanes";
import { laneLabel } from "@/lib/format";

type LaneData = { aesthetic: Aesthetic; trends: Trend[]; hasMore: boolean; failed: boolean };

export const Route = createFileRoute("/aesthetic/$id")({
  validateSearch: (search: Record<string, unknown>): { trend?: string } =>
    typeof search.trend === "string" && search.trend ? { trend: search.trend } : {},
  loader: async ({ params }): Promise<LaneData> => {
    const aesthetic = aesthetics.find((a) => a.id === params.id);
    if (!aesthetic) throw notFound();

    try {
      // First page only; the rest loads on demand (backend sorts by score).
      const { trends, hasMore } = await fetchLanePage(params.id, 0);
      return { aesthetic, trends, hasMore, failed: false };
    } catch (e) {
      console.error(e);
      return { aesthetic, trends: [], hasMore: false, failed: true };
    }
  },
  staleTime: LANE_STALE_TIME,
  pendingMs: 400,
  pendingComponent: LanePending,
  head: ({ loaderData }) => {
    const aesthetic = loaderData?.aesthetic;
    const title = aesthetic ? `${laneLabel(aesthetic.name)} trends on TrendXee` : "Lane — TrendXee";
    const description = aesthetic ? `${aesthetic.description}` : "A TrendXee lane of rising fits.";
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
    <StateShell
      eyebrow="This lane slipped off the board"
      title="We couldn't open this lane."
      body="It's on our side, not yours. Give it another try in a moment."
    />
  ),
  notFoundComponent: () => (
    <StateShell eyebrow="No such lane" title="That lane isn't pinned to the board." body="Pick one of the eight below." />
  ),
});

function LanePage() {
  const { aesthetic, trends, hasMore, failed } = Route.useLoaderData();
  const index = aesthetics.findIndex((a) => a.id === aesthetic.id);
  const heroImage = trends.map(trendImage).find(Boolean) || aesthetic.heroImage;

  return (
    <div className="pb-24">
      <LaneHero aesthetic={aesthetic} index={index} image={heroImage} />
      <LaneSwitcher activeId={aesthetic.id} />
      {/* Keyed by lane so switching lanes resets the loaded pages. */}
      <LaneFeed key={aesthetic.id} aesthetic={aesthetic} initialTrends={trends} initialHasMore={hasMore} failed={failed} />
    </div>
  );
}

/** The lane's cover. Its photo shares a view-transition name with the lane card it came from. */
function LaneHero({ aesthetic, index, image }: { aesthetic: Aesthetic; index: number; image: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-4 sm:px-8">
        <div className="relative h-[min(64svh,620px)] overflow-hidden rounded-[30px] bg-sand/40 shadow-lift">
          <div className="absolute inset-0" style={{ viewTransitionName: `lane-${aesthetic.id}` }}>
            <m.img
              src={image}
              alt=""
              fetchPriority="high"
              className={`h-full w-full ${aesthetic.id === "sneakers" ? "object-contain p-10" : "object-cover"}`}
              style={reduced ? undefined : { y, scale }}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/30 to-scrim/20" />

          <span className="enter-fade pointer-events-none absolute -top-6 right-4 font-display text-[clamp(8rem,20vw,17rem)] leading-none tracking-[-0.06em] text-on-scrim/15 sm:right-10">
            {String(index + 1).padStart(2, "0")}
          </span>

          <m.div className="absolute inset-x-0 bottom-0 p-6 text-on-scrim sm:p-10 lg:p-14" style={reduced ? undefined : { y: copyY }}>
            <Link
              to="/lanes"
              className="enter-fade inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-on-scrim/70 transition-colors hover:text-on-scrim"
            >
              <span aria-hidden>←</span> All lanes
            </Link>
            <h1 className="mt-4 overflow-hidden pb-[0.12em] font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.88] tracking-[-0.04em]">
              <span className="enter-line block" style={{ "--d": "80ms" } as React.CSSProperties}>
                {laneLabel(aesthetic.name)}
              </span>
            </h1>
            <p className="enter-fade mt-4 max-w-xl text-[16px] leading-relaxed text-on-scrim/80 sm:text-lg" style={{ "--d": "220ms" } as React.CSSProperties}>
              {aesthetic.description}
            </p>
            <ul className="enter-fade mt-5 flex flex-wrap gap-2" style={{ "--d": "300ms" } as React.CSSProperties}>
              {aesthetic.vibeTags.map((t) => (
                <li key={t} className="rounded-full border border-on-scrim/25 px-3 py-1 text-[12px] font-semibold text-on-scrim/80">
                  #{t}
                </li>
              ))}
            </ul>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/** Sticky, horizontally scrolling lane chips. The active pill slides between lanes. */
function LaneSwitcher({ activeId }: { activeId: string }) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = railRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  return (
    <nav aria-label="Lanes" className="sticky top-16 z-30 mt-6 border-y border-border bg-paper/85 backdrop-blur-md">
      <div ref={railRef} className="no-scrollbar mx-auto flex w-full max-w-[1440px] gap-1 overflow-x-auto px-5 py-2.5 sm:px-8">
        {aesthetics.map((a, i) => {
          const active = a.id === activeId;
          return (
            <Link
              key={a.id}
              to="/aesthetic/$id"
              params={{ id: a.id }}
              viewTransition={false}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                active ? "text-paper" : "text-ink/60 hover:text-ink"
              }`}
            >
              {active && <m.span layoutId="lane-pill" className="absolute inset-0 rounded-full bg-ink" transition={spring.layout} />}
              <span className={`relative font-mono text-[10px] ${active ? "text-paper/60" : "text-clay/80"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative">{laneLabel(a.name)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LaneFeed({
  aesthetic,
  initialTrends,
  initialHasMore,
  failed,
}: {
  aesthetic: Aesthetic;
  initialTrends: Trend[];
  initialHasMore: boolean;
  failed: boolean;
}) {
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const { trend: openId } = Route.useSearch();
  const [trends, setTrends] = useState(initialTrends);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Opening a story pushes ?trend=… so Back closes it. Closing it ourselves
  // steps back through that entry instead of stacking another one.
  const pushedRef = useRef(false);
  useEffect(() => {
    if (!openId) pushedRef.current = false;
  }, [openId]);

  const setOpen = (id: string | null) => {
    if (!id && pushedRef.current) {
      pushedRef.current = false;
      router.history.back();
      return;
    }
    if (id) pushedRef.current = true;
    navigate({
      search: (prev) => ({ ...prev, trend: id ?? undefined }),
      resetScroll: false,
      viewTransition: false,
      replace: !id,
    });
  };

  const loadMore = async () => {
    setLoading(true);
    setError(false);
    try {
      const next = await fetchLanePage(aesthetic.id, page + 1);
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

  if (failed) {
    return (
      <EmptyState
        title="The board didn't load."
        body="We couldn't reach the trend engine just now. It's usually back in a moment."
        action={
          <button type="button" onClick={() => router.invalidate()} className={ctaClass("primary")}>
            Try again
          </button>
        }
      />
    );
  }

  if (trends.length === 0) {
    return (
      <EmptyState
        title={`Nothing pinned in ${laneLabel(aesthetic.name)} yet.`}
        body="Lanes fill up as new signals come in. Meanwhile, the other lanes are moving."
        action={
          <Link to="/lanes" className={ctaClass("primary")}>
            Browse other lanes <CtaArrow />
          </Link>
        }
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pt-12 sm:px-8 lg:pt-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Rising in <em className="italic text-clay">{laneLabel(aesthetic.name)}</em>
        </h2>
        <p className="text-[13px] font-semibold text-ink/50">
          {trends.length} {trends.length === 1 ? "drop" : "drops"} · highest score first
        </p>
      </div>

      <TrendBoard
        trends={trends}
        openId={openId}
        onOpenChange={setOpen}
        onTrendChanged={(t) => setTrends((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)))}
        onTrendDeleted={(id) => setTrends((prev) => prev.filter((x) => x.id !== id))}
      />

      {hasMore && (
        <div className="mt-16 flex flex-col items-center gap-3">
          <Cta magnetic>
            <button type="button" onClick={loadMore} disabled={loading} className={`${ctaClass("outline", "lg")} min-w-[15rem]`}>
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <m.span
                        key={i}
                        className="size-1.5 rounded-full bg-current"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                  Pinning more drops
                </span>
              ) : (
                <>Load more drops</>
              )}
            </button>
          </Cta>
          {error && <p className="text-sm text-ink/60">That didn't load. Try once more.</p>}
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="hand text-xl text-clay">the board is quiet here</p>
        <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight">{title}</h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink/65">{body}</p>
        <div className="mt-8 flex justify-center">{action}</div>
      </div>
    </section>
  );
}

function StateShell({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8">
      <p className="hand text-xl text-clay">{eyebrow}</p>
      <h1 className="mt-2 max-w-2xl font-display text-5xl leading-tight tracking-tight">{title}</h1>
      <p className="mt-4 max-w-lg text-[16px] text-ink/65">{body}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {aesthetics.map((a) => (
          <Link key={a.id} to="/aesthetic/$id" params={{ id: a.id }} className={ctaClass("outline", "sm")}>
            {laneLabel(a.name)}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Editorial skeleton while a lane loads (only shown if loading takes >400ms). */
function LanePending() {
  return (
    <div className="pb-24" aria-busy="true" aria-label="Loading lane">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-4 sm:px-8">
        <div className="h-[min(64svh,620px)] animate-pulse rounded-[30px] bg-cream" />
      </div>
      <div className="mx-auto mt-24 grid w-full max-w-[1440px] gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[22px] ring-1 ring-border">
            <div className="aspect-[4/5] animate-pulse bg-cream" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded-full bg-cream" />
              <div className="h-6 w-4/5 animate-pulse rounded-full bg-cream" />
              <div className="h-3 w-full animate-pulse rounded-full bg-cream" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
