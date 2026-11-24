import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAudience } from "@/components/AudienceFilter";
import { ctaClass } from "@/components/Cta";
import { LaneFilters } from "@/components/LaneFilters";
import { styleName } from "@/components/SearchDialog";
import { TrendBoard } from "@/components/TrendBoard";
import { normalizeLanePage } from "@/lib/lane-filters";
import { aesthetics } from "@/lib/mock-data";
import { audienceLabel } from "@/lib/audience";
import { laneLabel } from "@/lib/format";
import { isSearchable, MAX_QUERY_LENGTH, normalizeSearchQuery, SEARCH_PAGE_SIZE, searchQuery, styleTarget } from "@/lib/search";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string; page?: number; trend?: string } => {
    const q = normalizeSearchQuery(search.q);
    const page = normalizeLanePage(search.page);
    return {
      ...(q ? { q } : {}),
      ...(page > 1 ? { page } : {}),
      ...(typeof search.trend === "string" && search.trend ? { trend: search.trend } : {}),
    };
  },
  head: ({ match }) => pageSeo({
    title: match.search.q ? `“${match.search.q}” — Search TrendXee` : "Search — TrendXee",
    description: "Search Indian indie fashion brands, styles and products on TrendXee.",
    path: "/search",
    noindex: true,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "", page = 1, trend: openId } = Route.useSearch();
  const audience = useAudience();
  const router = useRouter();
  const navigate = useNavigate({ from: Route.fullPath });
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  const searchable = isSearchable(q);
  const { data, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    ...searchQuery(q, audience, page),
    placeholderData: keepPreviousData,
  });
  const results = searchable ? data : undefined;
  const total = results?.total ?? 0;
  const pages = Math.ceil(total / SEARCH_PAGE_SIZE);
  const loading = searchable && (!results || isPlaceholderData) && !isError;

  // A shared link can point past the last page once products are removed.
  useEffect(() => {
    if (results && !isPlaceholderData && pages > 0 && page > pages) {
      void navigate({ search: (previous) => ({ ...previous, page: pages > 1 ? pages : undefined }), replace: true });
    }
  }, [results, isPlaceholderData, pages, page, navigate]);

  // Same behaviour as a lane: opening pushes ?trend=, closing steps back through it.
  const pushed = useRef(false);
  useEffect(() => {
    if (!openId) pushed.current = false;
  }, [openId]);
  const setOpen = (id: string | null) => {
    if (!id && pushed.current) {
      pushed.current = false;
      router.history.back();
      return;
    }
    if (id) pushed.current = true;
    void navigate({ search: (previous) => ({ ...previous, trend: id ?? undefined }), resetScroll: false, viewTransition: false, replace: !id });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = normalizeSearchQuery(text);
    if (isSearchable(next)) void navigate({ search: (previous) => ({ audience: previous.audience, q: next }) });
  };

  const showAll = () => void navigate({ search: (previous) => ({ ...previous, audience: undefined, page: undefined, trend: undefined }), resetScroll: false });

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-10 sm:px-8 lg:pt-14">
      <h1 className="font-display text-4xl tracking-tight [overflow-wrap:anywhere] sm:text-5xl">
        {searchable ? <>Results for <em className="italic text-clay">{q}</em></> : "Search"}
      </h1>
      <form role="search" onSubmit={submit} className="mt-6 flex max-w-xl gap-2">
        <input type="search" enterKeyHint="search" autoComplete="off" spellCheck={false} maxLength={MAX_QUERY_LENGTH}
          value={text} onChange={(event) => setText(event.target.value)} aria-label="Search brands, styles and products" placeholder="Brand, style or product"
          className="h-11 min-w-0 flex-1 rounded-full border border-ink/20 bg-raised/60 px-5 text-base placeholder:text-ink/50" />
        <button type="submit" className={ctaClass("primary")}>Search</button>
      </form>

      {searchable && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="meta" role="status" aria-live="polite">
            {loading ? "Searching…" : isError ? "Search is temporarily unavailable" : `${total} ${total === 1 ? "product" : "products"}${audience !== "ALL" ? ` · ${audienceLabel(audience)} + unisex` : ""}`}
          </p>
          <LaneFilters audience={audience} laneName="Search results" pending={loading}
            onApply={(next) => void navigate({
              search: (previous) => ({ ...previous, audience: next === "ALL" ? undefined : next, page: undefined, trend: undefined }),
              resetScroll: false, viewTransition: false,
            })} />
        </div>
      )}

      {results && !loading && results.styles.length > 0 && (
        <nav aria-label="Matching styles" className="mt-4 flex flex-wrap gap-2">
          {results.styles.map((style) => {
            const { id, collection } = styleTarget(style);
            return <Link key={id + (collection ?? "")} to="/aesthetic/$id" params={{ id }} search={(previous) => ({ audience: previous.audience, collection })} className={ctaClass("outline", "sm")}>{styleName(style)}</Link>;
          })}
        </nav>
      )}

      <div className={`mt-8 transition-opacity ${isFetching && isPlaceholderData ? "opacity-50" : ""}`} aria-busy={loading}>
        {!searchable ? (
          <Message title="Type at least two letters." body="Try a brand, a style like baggy jeans, or a colour." />
        ) : isError && !results ? (
          <Message title="Search didn't load." body="Check your connection and try again.">
            <button type="button" onClick={() => void refetch()} className={ctaClass("primary")}>Try again</button>
          </Message>
        ) : !results ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-[20px]" />)}
          </div>
        ) : total === 0 && !loading ? (
          <Message title={`Nothing found for “${q}”.`} body={audience === "ALL" ? "Check the spelling, use fewer words, or browse a lane." : "Try all fits, check the spelling, or browse a lane."}>
            {audience !== "ALL" && <button type="button" onClick={showAll} className={ctaClass("primary", "sm")}>Show all fits</button>}
            {aesthetics.map((lane) => <Link key={lane.id} to="/aesthetic/$id" params={{ id: lane.id }} className={ctaClass("outline", "sm")}>{laneLabel(lane.name)}</Link>)}
          </Message>
        ) : null}

        {searchable && (openId || !!results?.trends.length) && (
          <TrendBoard trends={results?.trends ?? []} openId={openId} onOpenChange={setOpen} batchSize={SEARCH_PAGE_SIZE}
            onTrendChanged={() => void refetch()} onTrendDeleted={() => void refetch()} />
        )}
      </div>

      {pages > 1 && !isError && <Pages page={Math.min(page, pages)} pages={pages} />}
    </div>
  );
}

function Pages({ page, pages }: { page: number; pages: number }) {
  const search = Route.useSearch();
  const control = "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors";
  const step = (next: number, label: string, rel: string) => next < 1 || next > pages
    ? <span aria-disabled className={`${control} opacity-35`}>{label}</span>
    : <Link to="/search" search={{ ...search, page: next > 1 ? next : undefined, trend: undefined }} rel={rel} className={`${control} hover:bg-ink/[0.06]`}>{label}</Link>;
  return (
    <nav aria-label="Result pages" className="mx-auto mt-12 flex max-w-lg items-center justify-between border-t border-border pt-5">
      {step(page - 1, "Previous", "prev")}
      <p className="text-sm text-ink/60">Page {page} of {pages}</p>
      {step(page + 1, "Next", "next")}
    </nav>
  );
}

function Message({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <section className="max-w-xl py-8">
      <h2 className="font-display text-3xl tracking-tight [overflow-wrap:anywhere]">{title}</h2>
      <p className="mt-3 text-ink/70">{body}</p>
      {children && <div className="mt-6 flex flex-wrap gap-2">{children}</div>}
    </section>
  );
}
