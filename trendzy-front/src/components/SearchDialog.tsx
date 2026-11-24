import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAudience } from "@/components/AudienceFilter";
import { Img } from "@/components/Img";
import { trendImage } from "@/components/TrendCard";
import { formatPrice, laneLabel, productImageFit } from "@/lib/format";
import { aesthetics } from "@/lib/mock-data";
import { isSearchable, MAX_QUERY_LENGTH, normalizeSearchQuery, searchQuery, styleTarget, type SearchStyle } from "@/lib/search";

const IDEAS = ["baggy jeans", "waffle tee", "black oversized tee", "cargo pants", "hoodie"];
const PREVIEW_SIZE = 6;
const row = "flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-ink/[0.05] focus-visible:bg-ink/[0.05]";
const chip = "inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-ink/40 hover:text-ink";

export function styleName(style: SearchStyle) {
  if (style.label) return style.label;
  const lane = aesthetics.find((a) => a.id === style.category.toLowerCase());
  return lane ? laneLabel(lane.name) : laneLabel(style.category);
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Search" title="Search" aria-haspopup="dialog" onClick={onClick}
      className="grid size-11 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink">
      <Search className="size-[18px]" aria-hidden />
    </button>
  );
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-0 flex h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-0 bg-paper p-0 pt-[env(safe-area-inset-top)] text-ink motion-reduce:animate-none sm:inset-auto sm:left-1/2 sm:top-[10dvh] sm:h-auto sm:max-h-[80dvh] sm:w-[640px] sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:rounded-[24px] sm:border sm:pt-0 [&>button:last-child]:top-[calc(0.5rem+env(safe-area-inset-top))] sm:[&>button:last-child]:top-2">
        <DialogTitle className="sr-only">Search TrendXee</DialogTitle>
        <DialogDescription className="sr-only">Find brands, styles and products. Results appear as you type.</DialogDescription>
        <SearchPanel onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const audience = useAudience();
  const panel = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [settled, setSettled] = useState("");
  const query = normalizeSearchQuery(text);
  const searching = isSearchable(query);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isError, isFetching, refetch } = useQuery({
    ...searchQuery(settled, audience, 1, PREVIEW_SIZE),
    placeholderData: keepPreviousData,
  });
  const waiting = isFetching || query !== settled;
  const empty = data && !data.total && !data.brands.length && !data.styles.length;

  /** Arrow keys walk from the input through the visible links. */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const stops = Array.from(panel.current?.querySelectorAll<HTMLElement>("input, a") ?? []);
    const next = stops[stops.indexOf(document.activeElement as HTMLElement) + (event.key === "ArrowDown" ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  return (
    <div ref={panel} onKeyDown={onKeyDown} className="flex min-h-0 flex-1 flex-col">
      <form role="search" className="flex shrink-0 items-center gap-3 border-b border-border pl-5 pr-14 transition-colors focus-within:border-clay"
        onSubmit={(event) => {
          event.preventDefault();
          if (!searching) return;
          onClose();
          void navigate({ to: "/search", search: (previous) => ({ audience: previous.audience, q: query }) });
        }}>
        <Search className="size-5 shrink-0 text-ink/50" aria-hidden />
        <input autoFocus type="search" enterKeyHint="search" autoComplete="off" spellCheck={false} maxLength={MAX_QUERY_LENGTH}
          value={text} onChange={(event) => setText(event.target.value)}
          aria-label="Search brands, styles and products" placeholder="Brand, style or product"
          className="h-[60px] min-w-0 flex-1 bg-transparent text-[17px] outline-none! placeholder:text-ink/50 [&::-webkit-search-cancel-button]:hidden" />
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3" aria-busy={searching && waiting}>
        {!searching ? (
          <>
            <Group title="Try">
              <div className="flex flex-wrap gap-2 px-3 pt-1">
                {IDEAS.map((idea) => (
                  <Link key={idea} to="/search" search={(previous) => ({ audience: previous.audience, q: idea })} onClick={onClose} className={chip}>{idea}</Link>
                ))}
              </div>
            </Group>
            <Lanes onClose={onClose} />
          </>
        ) : isError && !waiting ? (
          <div className="px-3 py-8" role="status">
            <p className="text-ink/70">Search isn't responding right now.</p>
            <button type="button" onClick={() => void refetch()} className="mt-2 min-h-11 font-semibold underline underline-offset-4">Try again</button>
          </div>
        ) : !data ? (
          <p className="px-3 py-8 text-ink/70" role="status">Searching…</p>
        ) : empty ? (
          <>
            <p className="px-3 py-6 text-ink/70" role="status">{waiting ? "Searching…" : `Nothing found for “${query}”. Check the spelling or browse a lane.`}</p>
            {!waiting && <Lanes onClose={onClose} />}
          </>
        ) : (
          <div className={`transition-opacity ${waiting ? "opacity-50" : ""}`}>
            {data.brands.length > 0 && (
              <Group title="Brands">
                {data.brands.map((brand) => (
                  <Link key={brand.name} to="/search" search={(previous) => ({ audience: previous.audience, q: normalizeSearchQuery(brand.name) })} onClick={onClose} className={row}>
                    <span className="truncate font-display text-lg italic">{brand.name}</span>
                    <Count value={brand.count} />
                  </Link>
                ))}
              </Group>
            )}
            {data.styles.length > 0 && (
              <Group title="Styles">
                {data.styles.map((style) => {
                  const { id, collection } = styleTarget(style);
                  return (
                    <Link key={style.category + (style.label ?? "")} to="/aesthetic/$id" params={{ id }} search={(previous) => ({ audience: previous.audience, collection })} onClick={onClose} className={row}>
                      <span className="truncate font-semibold">{styleName(style)}</span>
                      <Count value={style.count} />
                    </Link>
                  );
                })}
              </Group>
            )}
            {data.trends.length > 0 && (
              <Group title="Products">
                {data.trends.map((trend) => {
                  const product = trend.products.underdog;
                  return (
                    <Link key={trend.id} to="/search" search={(previous) => ({ audience: previous.audience, q: settled, trend: trend.id })} onClick={onClose} className={row}>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="block h-16 w-[52px] shrink-0 overflow-hidden rounded-lg bg-cream">
                          <Img src={trendImage(trend)} alt="" className={`h-full w-full ${productImageFit(trend.aestheticId, true)}`} />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-semibold leading-snug">{trend.name}</span>
                          <span className="block truncate text-[13px] text-ink/70">{product?.brandName}</span>
                        </span>
                      </span>
                      <span className="shrink-0 font-display tabular-nums">{formatPrice(product?.price, product?.currency)}</span>
                    </Link>
                  );
                })}
              </Group>
            )}
            {data.total > 0 && (
              <Link to="/search" search={(previous) => ({ audience: previous.audience, q: settled })} onClick={onClose} className={`${row} mt-2 border-t border-border font-semibold text-clay-ink`}>
                <span>{data.total === 1 ? "See the result" : `See all ${data.total} results`}</span> <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-2">
      <h3 className="px-3 pb-1 text-[13px] font-semibold text-ink/60">{title}</h3>
      {children}
    </section>
  );
}

function Count({ value }: { value: number }) {
  return <span className="shrink-0 text-[13px] text-ink/60">{value} {value === 1 ? "piece" : "pieces"}</span>;
}

function Lanes({ onClose }: { onClose: () => void }) {
  return (
    <Group title="Lanes">
      <div className="grid grid-cols-2">
        {aesthetics.map((lane) => (
          <Link key={lane.id} to="/aesthetic/$id" params={{ id: lane.id }} onClick={onClose} className={`${row} font-display text-lg`}>{laneLabel(lane.name)}</Link>
        ))}
      </div>
    </Group>
  );
}
