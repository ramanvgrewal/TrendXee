import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, LoaderCircle, RefreshCw } from "lucide-react";
import { Img } from "@/components/Img";
import { audienceLabel, normalizeProductAudience, type AudienceFilter } from "@/lib/audience";
import { formatPrice } from "@/lib/format";
import type { Trend } from "@/lib/mock-data";
import { advancePairing, chosenPairing, getPairings, getPairingTrend, nextPairing, PairingRequestError, type PairingChoices, type PairingItem } from "@/lib/pairings";

export function PairUpWith({ source, audience, setAudience, choices, setChoices, onOpen }: {
  source: Trend;
  audience: AudienceFilter;
  setAudience: (audience: AudienceFilter) => void;
  choices: PairingChoices;
  setChoices: Dispatch<SetStateAction<PairingChoices>>;
  onOpen: (trend: Trend, identity: string) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<{ identity: string; message: string } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [swapAnnouncement, setSwapAnnouncement] = useState("");
  const sourceUrl = source.products.underdog?.shopUrl;
  const sourceAudience = normalizeProductAudience(source.products.underdog?.audience);
  const canChooseAudience = sourceAudience === "UNISEX";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: "240px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => requestRef.current?.abort(), []);

  const query = useQuery({
    queryKey: ["product-pairings", source.id, sourceUrl, audience],
    queryFn: ({ signal }) => getPairings(source, audience, signal),
    enabled: visible && !!sourceUrl,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    retry: false,
  });

  const open = async (item: PairingItem) => {
    if (opening) return;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setOpening(item.identity);
    setOpenError(null);
    try {
      const current = await getPairingTrend(item, request.signal);
      const fit = normalizeProductAudience(current.products.underdog?.audience);
      const effective = query.data?.audience;
      if ((effective === "UNISEX" && fit !== "UNISEX") || (effective === "MEN" && fit === "WOMEN") || (effective === "WOMEN" && fit === "MEN")) throw new PairingRequestError(409);
      if (!request.signal.aborted) onOpen(current, item.identity);
    } catch (error) {
      if (request.signal.aborted) return;
      const unavailable = error instanceof PairingRequestError && (error.status === 404 || error.status === 409);
      setOpenError({ identity: item.identity, message: unavailable ? "This pick has changed or is no longer available. Try another in this role." : "We couldn't open this pick. Please try again." });
    } finally { if (!request.signal.aborted) setOpening(null); }
  };

  const data = query.data;
  const staleSource = query.error instanceof PairingRequestError && [404, 409].includes(query.error.status);
  return (
    <section ref={sectionRef} aria-labelledby="pair-up-heading" className="mt-8 min-w-0 scroll-mt-16 border-t border-border pt-6 lg:scroll-mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="pair-up-heading" className="font-display text-[22px] tracking-tight">Pair up with</h3>
        {!!data?.slots.length && <span className="text-[11px] text-ink/50">{data.slots.length} picks</span>}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-ink/60">A few pieces to finish the look. Tap one to explore.</p>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{swapAnnouncement}</span>

      {canChooseAudience && <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Styling preference">
        <span className="mr-1 text-xs text-ink/65">Style for</span>
        {(['ALL', 'MEN', 'WOMEN'] as const).map((option) => <button
          key={option} type="button" aria-pressed={audience === option} onClick={() => { setAudience(option); setChoices({}); setOpenError(null); }}
          className={`min-h-11 rounded-full border px-3 text-xs font-semibold ${audience === option ? "border-ink bg-ink text-paper" : "border-border text-ink/70 hover:border-clay"}`}
        >{option === 'ALL' ? 'Shared fits' : audienceLabel(option)}</button>)}
      </div>}

      {query.isError ? <div className="mt-5 rounded-xl bg-cream/60 p-4 text-sm text-ink/75" role="status">
        <p>{staleSource ? "This product has changed since the story opened. Reload for its current pairings." : "Pairings couldn't load. Your product story is still here."}</p>
        <button type="button" className="mt-2 min-h-11 font-semibold text-clay-ink underline underline-offset-4" onClick={() => staleSource ? window.location.reload() : void query.refetch()}>{staleSource ? "Reload story" : "Try again"}</button>
      </div> : !data ? <div className="mt-4 grid gap-2" aria-busy="true" aria-label="Finding complementary pieces">
        {[0, 1].map((i) => <div key={i} className="flex gap-3 rounded-xl border border-border p-2 motion-safe:animate-pulse"><div className="h-24 w-[72px] shrink-0 rounded-lg bg-cream/80" /><div className="flex-1 space-y-3 py-3"><div className="h-2 w-1/3 rounded bg-cream/80" /><div className="h-3 w-4/5 rounded bg-cream/80" /><div className="h-2 w-1/2 rounded bg-cream/80" /></div></div>)}
      </div> : data.needsAudience ? <p className="mt-5 rounded-xl bg-cream/60 p-4 text-[13px] leading-relaxed text-ink/75">Choose Men or Women above to find complementary fits. This is a styling preference; it doesn't change the product's sizing.</p>
        : data.slots.length === 0 ? <p className="mt-5 rounded-xl bg-cream/60 p-4 text-[13px] leading-relaxed text-ink/75">No confident pairings for this piece yet. More suitable picks will appear as the collection grows.</p>
          : <div id="pairing-pieces" className="mt-4 grid gap-2.5">
            {data.slots.map((slot) => {
              const item = chosenPairing(slot, choices);
              const product = item.trend.products.underdog!;
              const alternative = nextPairing(slot, choices, data.slots);
              const busy = opening === item.identity;
              return <article key={slot.role} className="group/row grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-center overflow-hidden rounded-xl border border-border bg-cream/15 pr-1 transition-colors hover:border-ink/25 hover:bg-cream/35 sm:grid-cols-[minmax(0,1fr)_56px] sm:pr-2">
                <button type="button" disabled={!!opening} aria-busy={busy} onClick={() => void open(item)} data-pairing-identity={item.identity} aria-label={`Open pairing: ${product.title}`} className="group flex min-w-0 items-center gap-3 rounded-xl p-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay disabled:cursor-wait sm:gap-3.5 sm:p-2.5">
                  <div className="relative h-[100px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-cream sm:w-[80px]">
                    <Img src={product.imageUrl} alt="" eager fallbackLabel="View photos" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] [&>span]:px-2 [&>span]:text-center [&>span]:text-[11px] [&>span]:not-italic [&>span]:text-ink/50" />
                    {busy && <span className="absolute inset-0 grid place-items-center bg-paper/60"><LoaderCircle className="size-5 motion-safe:animate-spin" /><span className="sr-only" role="status">Checking this pick…</span></span>}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate text-[10px] leading-4 text-ink/60"><span className="font-semibold text-clay-ink">{slot.label}</span><span className="px-1.5 text-ink/30">/</span>{product.brandName}</p>
                    <h4 className="mt-0.5 line-clamp-2 font-display text-[16px] leading-[1.2] transition-colors group-hover:text-clay-ink sm:text-[17px]">{product.title}</h4>
                    <p className="mt-1.5 flex items-center gap-2 text-[12px] font-semibold">{formatPrice(product.price, product.currency)}<ArrowUpRight className="size-3 text-ink/40" aria-hidden /></p>
                    <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-ink/55 sm:text-[11px]" title={item.reason}>{item.reason}</p>
                  </div>
                </button>
                  <button type="button" disabled={!alternative || !!opening} aria-label={`Try another ${slot.label.toLowerCase()}`} title={alternative ? `Swap ${slot.label.toLowerCase()}` : 'All options seen'} onClick={() => { setChoices((previous) => advancePairing(slot, previous, data.slots)); setOpenError(null); setSwapAnnouncement(`${slot.label}: ${alternative?.trend.products.underdog?.title}`); }} className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg text-ink/60 transition-colors hover:bg-cream hover:text-clay-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay disabled:cursor-default disabled:opacity-30">
                    <RefreshCw className="size-3.5" /><span className="text-[10px]">{alternative ? 'Swap' : 'Seen'}</span>
                  </button>
                {openError?.identity === item.identity && <p className="col-span-2 px-3 pb-3 text-xs leading-relaxed text-clay-ink" role="status">{openError.message}</p>}
              </article>;
            })}
          </div>}
      {data?.slots.length ? <p className="mt-3 text-[10px] leading-relaxed text-ink/45">Check sizing and availability at the brand's store.</p> : null}
    </section>
  );
}
