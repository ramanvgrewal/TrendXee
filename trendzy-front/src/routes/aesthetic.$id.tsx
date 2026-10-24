import { usePrefersReducedMotion as useReducedMotion } from "@/motion/hooks";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, redirect, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, m, useScroll, useTransform } from "framer-motion";
import { TrendBoard } from "@/components/TrendBoard";
import { trendImage } from "@/components/TrendCard";
import { CtaArrow, ctaClass } from "@/components/Cta";
import { ease, spring } from "@/motion/tokens";
import { Img } from "@/components/Img";
import type { Aesthetic, Trend } from "@/lib/mock-data";
import { aesthetics } from "@/lib/mock-data";
import { fetchLanePage, LANE_PAGE_SIZE, LANE_STALE_TIME } from "@/lib/lanes";
import { laneLabel } from "@/lib/format";
import { audienceLabel, normalizeAudienceFilter, type AudienceFilter } from "@/lib/audience";
import { useAudience } from "@/components/AudienceFilter";
import { LaneFilters } from "@/components/LaneFilters";
import { normalizeLaneFilters, normalizeLanePage, lanePageItems, type LaneFilters as Filters, type StyleOption } from "@/lib/lane-filters";
import { CatalogRequestError } from "@/lib/api";
import { cachedStyles, hasCatalogFailure, markCatalogFailure, rememberStyles } from "@/lib/catalog-state";

type LaneData = { aesthetic: Aesthetic; trends: Trend[]; hasMore: boolean; failed: boolean; total?: number; styles: StyleOption[] };

export const Route = createFileRoute("/aesthetic/$id")({
  validateSearch: (search: Record<string, unknown>): Filters & { trend?: string; page?: number } => ({
    ...normalizeLaneFilters(search),
    ...(normalizeLanePage(search.page) > 1 ? { page: normalizeLanePage(search.page) } : {}),
    ...(typeof search.trend === "string" && search.trend ? { trend: search.trend } : {}),
  }),
  loaderDeps: ({ search }) => ({ audience: normalizeAudienceFilter(search.audience), ...normalizeLaneFilters(search), page: normalizeLanePage(search.page) }),
  shouldReload: ({ params, deps }) => hasCatalogFailure(params.id, deps.audience, deps) ? true : undefined,
  loader: async ({ params, deps, location }): Promise<LaneData> => {
    const aesthetic = aesthetics.find((a) => a.id === params.id);
    if (!aesthetic) throw notFound();

    let result;
    try {
      result = await fetchLanePage(params.id, deps.page - 1, deps.audience, deps);
    } catch (e) {
      if (e instanceof CatalogRequestError && e.status === 400 && deps.style) {
        const linkedTrend = (location.search as Record<string, unknown>).trend;
        // Old or cross-lane style links are a filter reset, not an engine outage.
        throw redirect({ to: "/aesthetic/$id", params, search: {
          audience: deps.audience === "ALL" ? undefined : deps.audience,
          trend: typeof linkedTrend === "string" ? linkedTrend : undefined,
        }, replace: true });
      }
      console.error(e);
      return { aesthetic, trends: [], hasMore: false, styles: cachedStyles(params.id), failed: true };
    }
    const lastPage = Math.max(1, Math.ceil(result.total / LANE_PAGE_SIZE));
    if (deps.page > lastPage) {
      throw redirect({ to: "/aesthetic/$id", params, search: {
        ...location.search, page: lastPage > 1 ? lastPage : undefined,
      }, replace: true });
    }
    return { aesthetic, ...result, failed: false };
  },
  staleTime: LANE_STALE_TIME,
  // Keep the current grid and filter trigger visible during refinement, even on slow connections.
  pendingMs: Infinity,
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
    <StateShell eyebrow="No such lane" title="That lane isn't pinned to the board." body="Pick one of the lanes below." />
  ),
});

function LanePage() {
  const audience = useAudience();
  const { aesthetic, trends, failed, total, styles } = Route.useLoaderData();
  const search = Route.useSearch();
  const filters = normalizeLaneFilters(search);
  const page = normalizeLanePage(search.page);
  const index = aesthetics.findIndex((a) => a.id === aesthetic.id);
  const firstDrop = trends.find((trend) => trend.products?.underdog && trendImage(trend));
  const heroImage = (firstDrop && trendImage(firstDrop)) || (audience === "ALL" ? aesthetic.heroImage : "");

  return (
    <div className="pb-24">
      <LaneHero key={`hero-${aesthetic.id}-${audience}`} aesthetic={aesthetic} index={index} image={heroImage} firstDrop={firstDrop} />
      <LaneSwitcher activeId={aesthetic.id} />
      {/* Keep the feed mounted so filters retain focus while results change. */}
      <LaneFeed key={aesthetic.id} audience={audience} filters={filters} total={total} styles={styles} aesthetic={aesthetic} initialTrends={trends} page={page} failed={failed} />
    </div>
  );
}

/**
 * The lane's cover. Phones get the photo full-bleed (a portrait frame suits a
 * portrait product shot); wide screens get a cream section opener with the
 * photo as a pinned portrait print, so it is never blown up into a soft crop.
 * The photo shares a view-transition name with the lane card it came from.
 */
function LaneHero({ aesthetic, index, image, firstDrop }: { aesthetic: Aesthetic; index: number; image: string; firstDrop?: Trend }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const vt = { viewTransitionName: `lane-${aesthetic.id}` } as React.CSSProperties;

  const cover = (
    // Switching lanes cross-dissolves the cover instead of hard-swapping it.
    <AnimatePresence initial={false}>
      <m.div
        key={aesthetic.id}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: ease.drift }}
      >
        {image ? <Img src={image} priority className="h-full w-full object-cover" /> : (
          <div className="grid h-full place-items-center bg-ink p-8 text-center text-on-scrim/75">
            <p className="font-display text-2xl italic">New finds are on the way.</p>
          </div>
        )}
      </m.div>
    </AnimatePresence>
  );

  return (
    <section ref={ref} className="relative isolate overflow-hidden">
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-4 sm:px-8">
        <div className="relative grid min-h-[min(64svh,620px)] overflow-hidden rounded-[28px] bg-sand/40 shadow-lift lg:min-h-[clamp(460px,62svh,580px)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-center lg:fibre lg:bg-cream lg:shadow-none lg:ring-1 lg:ring-border">
          {/* Phones and tablets: full-bleed photo under a scrim */}
          <div className="absolute inset-0 lg:hidden" style={vt}>
            <m.div className="absolute inset-0" style={reduced ? undefined : { y, scale }}>
              {cover}
            </m.div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/95 via-scrim/60 to-scrim/45 lg:hidden" />

          {/* Wide screens: the photo as a pinned portrait print */}
          <div className="relative flex min-w-0 flex-col justify-end p-6 text-on-scrim sm:p-10 lg:justify-center lg:p-12 lg:text-ink xl:p-14">
            <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-3">
            <Link
              to="/lanes"
              className="hit enter-fade inline-flex items-center gap-2 eyebrow text-on-scrim/70 transition-colors hover:text-on-scrim lg:text-ink/70 lg:hover:text-clay"
            >
              <span aria-hidden>←</span> All lanes
            </Link>
              <span aria-hidden className="pointer-events-none shrink-0 font-display text-5xl leading-none tracking-[-0.06em] text-on-scrim/40 lg:order-first lg:numeral-outline lg:text-[6rem] lg:leading-[0.85]">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h1 className="mt-6 text-balance pb-[0.12em] font-display text-[clamp(2.5rem,8.5vw,6rem)] leading-[0.98] tracking-[-0.04em] [overflow-wrap:anywhere] lg:mt-5 lg:text-[clamp(3.5rem,7.6vw,7.5rem)]">
              <span key={aesthetic.id} className="enter-fade block">
                {laneLabel(aesthetic.name)}
              </span>
            </h1>
            <p key={aesthetic.id} className="enter-fade mt-4 max-w-xl text-pretty text-[16px] leading-relaxed text-on-scrim/85 sm:text-lg lg:text-ink/75" style={{ "--d": "220ms" } as React.CSSProperties}>
              {aesthetic.description}
            </p>
            <ul key={`${aesthetic.id}-tags`} className="enter-fade mt-5 flex flex-wrap gap-2" style={{ "--d": "300ms" } as React.CSSProperties}>
              {aesthetic.vibeTags.map((t) => (
                <li key={t} className="rounded-full border border-on-scrim/25 px-3 py-1 text-[12px] font-semibold text-on-scrim/80 lg:border-ink/20 lg:text-ink/70">
                  #{t}
                </li>
              ))}
            </ul>
          </div>
          {firstDrop ? (
            <HeroDrop key={`${aesthetic.id}-${firstDrop.id}-${image}`} trend={firstDrop} laneId={aesthetic.id} />
          ) : (
          <div className="relative mx-auto my-10 hidden aspect-[4/5] w-[78%] max-w-[360px] lg:block">
            <div className="h-full rotate-[1.5deg] rounded-[24px] bg-paper p-2 shadow-print ring-1 ring-border">
              <div className="relative h-full overflow-hidden rounded-[18px] bg-sand/50" style={vt}>
                {cover}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** A simple portrait print of the first drop, matching the lane cover design. */
function HeroDrop({ trend, laneId }: { trend: Trend; laneId: string }) {
  const product = trend.products.underdog!;
  const photos = [...new Set([product.imageUrl, ...(product.imageUrls ?? [])].filter(Boolean))];
  const [photoIndex, setPhotoIndex] = useState(0);
  return (
    <Link
      to="/aesthetic/$id"
      params={{ id: laneId }}
      search={(previous) => ({ ...previous, trend: trend.id })}
      resetScroll={false}
      viewTransition={false}
      aria-label={`Open first drop: ${product.title || trend.name}`}
      className="group/drop relative mx-auto my-10 hidden aspect-[4/5] w-[80%] max-w-[360px] rotate-[1.5deg] rounded-[24px] bg-paper p-2 shadow-print ring-1 ring-border outline-offset-4 transition-shadow hover:shadow-lift lg:block"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-cream">
        {photoIndex < photos.length ? (
          <img
            src={photos[photoIndex]}
            alt={product.title || trend.name}
            loading="eager"
            decoding="async"
            onError={() => setPhotoIndex((index) => index + 1)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/drop:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center p-3 font-display text-xl italic text-ink/50">{product.brandName || "Indie label"}</div>
        )}
      </div>
    </Link>
  );
}

/** Sticky, horizontally scrolling lane chips. The active pill slides between lanes. */
function LaneSwitcher({ activeId }: { activeId: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (rail && active) {
      // Centre the active chip within the rail only (never scrolls the page).
      const left = active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2;
      rail.scrollTo({ left, behavior: firstRun.current ? "auto" : "smooth" });
    }
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    // Switching lanes from deep in the feed keeps you at the feed, not the cover.
    const anchor = anchorRef.current;
    if (anchor) {
      const stickyOffset = 64;
      const anchorTop = anchor.getBoundingClientRect().top + window.scrollY - stickyOffset;
      if (window.scrollY > anchorTop) window.scrollTo({ top: anchorTop });
    }
  }, [activeId]);

  return (
    <>
    <div ref={anchorRef} aria-hidden />
    <nav aria-label="Lanes" className="sticky top-16 z-30 mt-6 border-y border-border bg-paper/95 backdrop-blur-md">
      <div ref={railRef} className="no-scrollbar mx-auto flex w-full max-w-[1440px] gap-1 overflow-x-auto px-5 py-2.5 sm:px-8">
        {aesthetics.map((a, i) => {
          const active = a.id === activeId;
          return (
            <Link
              key={a.id}
              to="/aesthetic/$id"
              params={{ id: a.id }}
              viewTransition={false}
              resetScroll={false}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                active ? "text-paper" : "text-ink/70 hover:text-ink"
              }`}
            >
              {active && <m.span layoutId="lane-pill" className="absolute inset-0 rounded-full bg-ink" transition={spring.layout} />}
              <span className={`relative font-mono text-[10px] ${active ? "text-paper/70" : "text-clay-ink"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative">{laneLabel(a.name)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}

function LaneFeed({
  aesthetic,
  initialTrends,
  page,
  failed,
  audience,
  filters,
  total,
  styles,
}: {
  aesthetic: Aesthetic;
  initialTrends: Trend[];
  page: number;
  failed: boolean;
  audience: AudienceFilter;
  filters: Filters;
  total?: number;
  styles: StyleOption[];
}) {
  const navigate = useNavigate({ from: Route.fullPath });
  const router = useRouter();
  const pending = useRouterState({ select: (state) => state.status === "pending" });
  const { trend: openId } = Route.useSearch();
  const [trends, setTrends] = useState(initialTrends);
  const feedRef = useRef<HTMLElement>(null);
  const pageKey = `${aesthetic.id}:${audience}:${filters.style || ""}:${page}`;
  const previousPageRef = useRef(pageKey);
  const retriesRef = useRef({ key: "", count: 0 });
  useEffect(() => { rememberStyles(aesthetic.id, styles); }, [aesthetic.id, styles]);
  useEffect(() => {
    markCatalogFailure(aesthetic.id, audience, { ...filters, page }, failed);
    const key = pageKey;
    if (retriesRef.current.key !== key || !failed) retriesRef.current = { key, count: 0 };
    if (!failed) return;
    const retry = () => { void router.invalidate({ filter: (match) => match.routeId === Route.id }); };
    const onFocus = () => { if (document.visibilityState === "visible") retry(); };
    window.addEventListener("online", retry);
    window.addEventListener("focus", onFocus);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (retriesRef.current.count < 2) {
      retriesRef.current.count++;
      timer = setTimeout(retry, 1500 * retriesRef.current.count);
    }
    return () => { clearTimeout(timer); window.removeEventListener("online", retry); window.removeEventListener("focus", onFocus); };
  }, [failed, initialTrends, aesthetic.id, audience, filters.style, page, pageKey, router]);
  useEffect(() => { setTrends(initialTrends); }, [initialTrends]);
  useEffect(() => {
    if (previousPageRef.current === pageKey) return;
    previousPageRef.current = pageKey;
    // Arrive at the results, below both sticky navigation bars. Never jump to the cover.
    const heading = feedRef.current?.querySelector<HTMLElement>("h2");
    if (heading) {
      const top = heading.getBoundingClientRect().top + window.scrollY - 148;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      heading.focus({ preventScroll: true });
    }
  }, [pageKey, initialTrends]);

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

  const resetFilters = () => navigate({
    search: (previous) => ({ ...previous, audience: undefined, style: undefined, page: undefined, trend: undefined }),
    resetScroll: false,
    viewTransition: false,
  });

  const emptyContent = failed ? (
      <EmptyState
        title="The board didn't load."
        body="We couldn't reach the trend engine just now. It's usually back in a moment."
        action={
          <button type="button" onClick={() => router.invalidate()} className={ctaClass("primary")}>
            Try again
          </button>
        }
      />
    ) : trends.length === 0 ? (
      <EmptyState
        title={filters.style || audience !== "ALL" ? "No drops match these filters." : `Nothing pinned in ${laneLabel(aesthetic.name)} yet.`}
        body="Try another style or fit, or clear the filters to see every drop in this lane."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            {(audience !== "ALL" || filters.style) && <button type="button" onClick={resetFilters} className={ctaClass("primary")}>Clear filters</button>}
            <Link to="/lanes" className={ctaClass(audience === "ALL" ? "primary" : "outline")}>
              Browse other lanes <CtaArrow />
            </Link>
          </div>
        }
      />
    ) : null;

  return (
    <m.section
      ref={feedRef}
      aria-busy={pending}
      className="mx-auto w-full max-w-[1440px] px-5 pt-12 sm:px-8 lg:pt-16"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: ease.drift }}
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
        <h2 tabIndex={-1} className="font-display text-3xl tracking-tight outline-none sm:text-4xl">
          Rising in <em className="italic text-clay">{laneLabel(aesthetic.name)}</em>
        </h2>
        <p className="meta mt-2" role="status" aria-live="polite" aria-atomic="true">
          {pending ? "Finding your fits…" : failed ? "Drops temporarily unavailable" : `${total ?? trends.length} ${(total ?? trends.length) === 1 ? "drop" : "drops"}${audience !== "ALL" ? ` · ${audienceLabel(audience)} + unisex` : ""} · highest hype score first`}
        </p>
        {filters.style && <p className="mt-1 text-xs text-clay-ink">{styles.find((style) => style.id === filters.style)?.label}</p>}
        </div>

      <LaneFilters audience={audience} filters={filters} styles={styles} laneName={laneLabel(aesthetic.name)} pending={pending} unavailable={failed && styles.length === 0}
        onApply={(change) => {
          void navigate({
            search: (previous) => ({ ...previous, ...change, ...(change.audience === "ALL" ? { audience: undefined } : {}), page: undefined, trend: undefined }),
            resetScroll: false,
            viewTransition: false,
          });
        }} />
      </div>

      {emptyContent || <TrendBoard
        trends={trends}
        openId={openId}
        onOpenChange={setOpen}
        onTrendChanged={(t) => setTrends((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)))}
        onTrendDeleted={(id) => {
          setTrends((prev) => prev.filter((x) => x.id !== id));
          // Recount pages and clamp the URL if the last product on a page was removed.
          void router.invalidate({ filter: (match) => match.routeId === Route.id });
        }}
      />}

      {!failed && (total ?? 0) > LANE_PAGE_SIZE && (
        <LanePagination page={page} total={Math.ceil(total! / LANE_PAGE_SIZE)} pending={pending} />
      )}

    </m.section>
  );
}

function LanePagination({ page, total, pending }: { page: number; total: number; pending: boolean }) {
  const navigate = useNavigate({ from: Route.fullPath });
  const go = (next: number) => {
    if (pending || next === page || next < 1 || next > total) return;
    void navigate({
      search: (previous) => ({ ...previous, page: next > 1 ? next : undefined, trend: undefined }),
      resetScroll: false,
      viewTransition: false,
    });
  };
  const control = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors hover:bg-ink/[0.06] disabled:opacity-35 disabled:hover:bg-transparent";
  return (
    <nav aria-label="Product pages" className="mx-auto mt-10 max-w-lg border-t border-border pt-5 sm:mt-12">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button type="button" aria-label="Previous page" disabled={pending || page <= 1} onClick={() => go(page - 1)} className={`${control} justify-self-start`}><span aria-hidden>←</span> Previous</button>
        <p className="text-xs text-ink/55" aria-live="polite">Page {page} of {total}</p>
        <button type="button" aria-label="Next page" disabled={pending || page >= total} onClick={() => go(page + 1)} className={`${control} justify-self-end`}>Next <span aria-hidden>→</span></button>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {lanePageItems(page, total).map((item, index) => item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="grid h-11 w-5 place-items-center text-ink/45">…</span>
        ) : (
          <button key={item} type="button" aria-label={`Page ${item}`} aria-current={item === page ? "page" : undefined} disabled={pending} onClick={() => go(item)}
            className={`grid size-11 place-items-center rounded-full text-sm font-semibold transition-colors disabled:cursor-wait ${item === page ? "bg-ink text-paper" : "text-ink/65 hover:bg-ink/[0.06] hover:text-ink"}`}>{item}</button>
        ))}
      </div>
    </nav>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="hand text-xl text-clay-ink">the board is quiet here</p>
        <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight">{title}</h2>
        <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{body}</p>
        <div className="mt-8 flex justify-center">{action}</div>
      </div>
    </section>
  );
}

function StateShell({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8">
      <p className="hand text-xl text-clay-ink">{eyebrow}</p>
      <h1 className="mt-2 max-w-2xl font-display text-5xl leading-tight tracking-tight">{title}</h1>
      <p className="mt-4 max-w-lg text-[16px] text-ink/70">{body}</p>
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
        <div className="h-[min(64svh,620px)] skeleton rounded-[28px]" />
      </div>
      <div className="mx-auto mt-24 grid w-full max-w-[1440px] gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[20px] bg-raised shadow-card">
            <div className="skeleton aspect-[4/5]" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 skeleton rounded-full" />
              <div className="h-6 w-4/5 skeleton rounded-full" />
              <div className="h-3 w-full skeleton rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
