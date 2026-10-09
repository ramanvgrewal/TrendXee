import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function TrustBadge({ rating, signals }: { rating?: number; signals?: Record<string, any> }) {
  if (!rating) return null;
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default items-center gap-1 rounded bg-cream px-1.5 py-0.5 text-[12px] font-medium text-ink/80 shadow-sm border border-ink/5 relative z-20 pointer-events-auto">
            <span className="text-amber-500">★</span> {rating.toFixed(1)}
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={4} className="bg-raised text-ink border border-border shadow-lift rounded-xl p-3 flex flex-col gap-1 max-w-[200px] z-[100]">
          <p className="font-semibold text-[13px] mb-1">Trust Signals</p>
          {signals?.codAvailable && <p className="text-[12px] text-ink/80 flex gap-1.5 items-center">✔️ Cash on Delivery</p>}
          {signals?.igFollowers && <p className="text-[12px] text-ink/80 flex gap-1.5 items-center">✔️ {signals.igFollowers} IG Followers</p>}
          {signals?.igEngagement && <p className="text-[12px] text-ink/80 flex gap-1.5 items-center">✔️ {signals.igEngagement} Engagement</p>}
          {signals?.reviews && <p className="text-[12px] text-ink/80 flex gap-1.5 items-center">✔️ Shopify Reviews</p>}
          {(!signals || Object.keys(signals).length === 0) && <p className="text-[12px] text-ink/60 italic">No specific signals</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
