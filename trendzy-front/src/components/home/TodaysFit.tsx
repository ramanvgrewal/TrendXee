import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Img } from "@/components/Img";
import { TrendDetail } from "@/components/TrendDetail";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { ScrollReveal } from "@/motion/ScrollReveal";
import { useAudience } from "@/components/AudienceFilter";
import type { RotationItem } from "@/lib/lanes";
import type { Trend } from "@/lib/mock-data";
import { getTrend } from "@/lib/api";
import { getPairings, trackOutfit, type PairingResult } from "@/lib/pairings";
import { formatPrice, isShoeCategory, productImageFit } from "@/lib/format";
import { retailerHref } from "@/lib/outbound";
import { trackProductClick } from "@/lib/useTrendActions";

/** Try at most this many board products to find one with a reviewed outfit. */
const MAX_CANDIDATES = 6;

type Fit = { source: Trend; outfit: PairingResult; isLead: boolean };

type Piece = { trend: Trend; label: string; hero?: boolean };

/**
 * Today's Fit: the hero product plus its reviewed complete outfit, the same
 * format as the daily reels. It uses the hero first and otherwise the next
 * board product that has a reviewed look. With none, the section is hidden.
 */
async function findTodaysFit(candidates: RotationItem[], audience: "ALL" | "MEN" | "WOMEN", signal: AbortSignal): Promise<Fit | null> {
  for (const [index, item] of candidates.slice(0, MAX_CANDIDATES).entries()) {
    try {
      const source = await getTrend(item.id, signal);
      const outfit = await getPairings(source, audience, signal);
      if (outfit.engine === "vision-v2" && outfit.slots.length) return { source, outfit, isLead: index === 0 };
    } catch (error) {
      if (signal.aborted) throw error;
      // A missing or unreviewed product just moves on to the next candidate.
    }
  }
  return null;
}

/** Review notes can start with a short internal label such as "Photo-inspired alternative:". */
export function publicReason(text?: string) {
  const clean = (text || "").replace(/^[A-Za-z][A-Za-z -]{0,40}:\s+/, "").trim();
  return clean ? clean[0].toUpperCase() + clean.slice(1) : "";
}

export function TodaysFit({ candidates, featured }: { candidates: RotationItem[]; featured: boolean }) {
  const audience = useAudience();
  const [openTrend, setOpenTrend] = useState<Trend | null>(null);
  const impression = useRef<string | null>(null);
  const key = candidates.slice(0, MAX_CANDIDATES).map((item) => item.id).join(",");

  const { data, isPending } = useQuery({
    queryKey: ["todays-fit", key, audience],
    queryFn: ({ signal }) => findTodaysFit(candidates, audience, signal),
    enabled: candidates.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!data?.outfit.outfitId || impression.current === data.outfit.outfitId) return;
    impression.current = data.outfit.outfitId;
    trackOutfit(data.outfit, "IMPRESSION");
  }, [data]);

  if (!candidates.length || (!isPending && !data)) return null;

  const pieces: Piece[] = data
    ? [
        { trend: data.source, label: data.isLead && featured ? "Featured underdog" : "The hero piece", hero: true },
        ...data.outfit.slots.map((slot) => ({ trend: slot.items[0].trend, label: slot.label })),
      ]
    : [];
  const prices = pieces.map((p) => p.trend.products.underdog?.price).filter((n): n is number => typeof n === "number" && n > 0);
  const total = prices.length === pieces.length ? formatPrice(prices.reduce((a, b) => a + b, 0), "INR") : null;
  const reason = publicReason(data?.outfit.reason || data?.outfit.slots[0]?.items[0]?.reason);

  return (
    <section id="todays-fit" aria-labelledby="todays-fit-heading" aria-busy={isPending} className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-5 pb-[clamp(2.5rem,5vw,4.5rem)] pt-[clamp(2.5rem,5vw,4rem)] sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="eyebrow flex items-center gap-2 text-ink/70">
            <span className="inline-block size-1.5 rounded-full bg-clay" /> The look of the day
          </p>
          <h2 id="todays-fit-heading" className="mt-3 font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-none tracking-[-0.025em]">
            Today's <em className="italic text-clay">fit</em>
          </h2>
        </div>
        <p className="lede max-w-md">
          {reason || "One underdog piece and a complete, reviewed outfit around it — every piece from an Indian label."}
        </p>
      </div>

      {isPending ? (
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 md:grid-cols-4" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-cream sm:rounded-[20px]" />
          ))}
        </ul>
      ) : (
        <>
          <ul className={`mt-7 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-10 sm:gap-x-6 sm:gap-y-10 ${pieces.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {pieces.map(({ trend, label, hero }, i) => {
              const product = trend.products.underdog!;
              const price = formatPrice(product.price, product.currency);
              const category = trend.aestheticId;
              const source = hero ? "todays-fit-hero" : "todays-fit";
              return (
                <ScrollReveal as="li" key={`${trend.id}-${i}`} index={i} y={20} className="group/fit relative min-w-0">
                  <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream shadow-card transition-shadow duration-[350ms] group-hover/fit:shadow-lift sm:rounded-[20px] ${hero ? "ring-2 ring-clay" : ""}`}>
                    <Img
                      src={product.imageUrl}
                      alt={`${product.title} by ${product.brandName || "an indie label"}`}
                      fallbackLabel={product.brandName}
                      className={`h-full w-full ${productImageFit(category)} ${isShoeCategory(category) ? "" : "group-hover/fit:scale-[1.03]"}`}
                    />
                    <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] sm:left-3.5 sm:top-3.5 ${hero ? "bg-stamp-clay text-paper" : "bg-paper/90 text-ink"}`}>
                      {label}
                    </span>
                  </div>
                  <div className="pt-3 sm:pt-4">
                    <p className="truncate font-display text-[14px] italic text-ink/75 sm:text-[15px]">{product.brandName || "Indie label"}</p>
                    <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-[1.25] tracking-[-0.01em] sm:text-[1.15rem] sm:leading-[1.2]">
                      {product.title || trend.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      {price ? <span className="font-display text-base tabular-nums sm:text-lg">{price}</span> : <span className="text-[13px] text-ink/60">Price at the store</span>}
                      <a
                        href={retailerHref(product.shopUrl, hero ? "todays_fit_hero" : "todays_fit")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackProductClick(trend.id, product.shopUrl, source);
                          if (data) trackOutfit(data.outfit, "SHOP_CLICK", trend.id);
                        }}
                        aria-label={`Shop ${product.title} by ${product.brandName || "the label"}`}
                        className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-clay-ink underline decoration-clay/30 underline-offset-4 hover:text-clay"
                      >
                        Shop <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Cta magnetic>
              <button type="button" onClick={() => data && setOpenTrend(data.source)} className={ctaClass("primary")}>
                Open the full look and swap pieces <CtaArrow />
              </button>
            </Cta>
            {total && <p className="text-sm text-ink/70">Whole look: <span className="font-display text-base tabular-nums text-ink">{total}</span> for {pieces.length} pieces, each from the label's own store</p>}
          </div>
        </>
      )}

      <TrendDetail trend={openTrend} onClose={() => setOpenTrend(null)} />
    </section>
  );
}
