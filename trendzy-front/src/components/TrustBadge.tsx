import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type TrustBadgeProps = {
  /** Average of ratings left by signed-in TrendXee shoppers. */
  ratingAverage?: number;
  ratingCount?: number;
  /** Facts recorded by the store audit (see `ratingSignals` on a trend). */
  signals?: Record<string, unknown>;
  /** Say "No ratings yet" when there is nothing to show (story view); cards stay quiet. */
  showEmpty?: boolean;
};

const chip =
  "relative z-20 pointer-events-auto inline-flex shrink-0 cursor-default items-center gap-1 rounded-full border border-border bg-cream px-2 py-0.5 font-body text-[12px] font-semibold not-italic leading-4 text-ink/80";

/**
 * What we actually know about a brand, and nothing more: a star rating only
 * when shoppers have left one, otherwise the audit facts we verified.
 */
export function TrustBadge({ ratingAverage, ratingCount, signals, showEmpty = false }: TrustBadgeProps) {
  const count = Math.max(0, Math.floor(ratingCount ?? 0));
  const rated = count > 0 && typeof ratingAverage === "number" && ratingAverage > 0;
  const cod = signals?.codAvailable === true;

  if (!rated && !cod) {
    return showEmpty ? <span className="font-body text-[12px] font-semibold not-italic text-ink/55">No ratings yet</span> : null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {rated ? (
            <span className={chip} aria-label={`Rated ${ratingAverage.toFixed(1)} out of 5 by ${count} ${count === 1 ? "shopper" : "shoppers"}`}>
              <span aria-hidden className="text-warning">★</span>
              <span className="tabular-nums">{ratingAverage.toFixed(1)}</span>
              <span className="font-normal text-ink/55">({count})</span>
            </span>
          ) : (
            <span className={chip} aria-label="Cash on Delivery available">
              <Check aria-hidden className="size-3 text-success" strokeWidth={2.5} />
              COD
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="z-[100] flex max-w-[220px] flex-col gap-1.5 rounded-xl border border-border bg-raised p-3 text-ink shadow-lift">
          {rated ? (
            <>
              <p className="text-[13px] font-semibold">Shopper rating</p>
              <p className="text-[12px] leading-snug text-ink/70">
                Average from {count} signed-in TrendXee {count === 1 ? "shopper" : "shoppers"}.
              </p>
            </>
          ) : (
            <p className="text-[13px] font-semibold">Checked at the brand's store</p>
          )}
          {cod && (
            <p className="flex items-center gap-1.5 text-[12px] text-ink/80">
              <Check aria-hidden className="size-3 shrink-0 text-success" strokeWidth={2.5} /> Cash on Delivery available
            </p>
          )}
          {!rated && <p className="text-[12px] leading-snug text-ink/60">No shopper ratings yet.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
