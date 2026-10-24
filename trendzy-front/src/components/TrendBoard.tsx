import { useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { TrendCard } from "@/components/TrendCard";
import { TrendDetail } from "@/components/TrendDetail";
import { ScrollReveal } from "@/motion/ScrollReveal";
import type { Trend } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { getTrend } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ctaClass } from "@/components/Cta";

/**
 * A grid of trend cards plus the opened story. The parent owns which story is
 * open (URL search param on lanes, local state in the archive) so browser Back
 * closes it. Cards reveal in a short stagger per loaded batch.
 */
export function TrendBoard({
  trends,
  openId,
  onOpenChange,
  onTrendChanged,
  onTrendDeleted,
  archivedContext = false,
  onUnarchived,
  batchSize = 12,
}: {
  trends: Trend[];
  openId?: string | null;
  onOpenChange: (id: string | null) => void;
  onTrendChanged?: (trend: Trend) => void;
  onTrendDeleted?: (id: string) => void;
  archivedContext?: boolean;
  onUnarchived?: (id: string) => void;
  batchSize?: number;
}) {
  const [lastOpenId, setLastOpenId] = useState<string | null>(openId ?? null);
  useEffect(() => {
    if (openId) setLastOpenId(openId);
  }, [openId]);

  const activeLayoutId = openId ?? lastOpenId;
  const loaded = openId ? trends.find((t) => t.id === openId) : undefined;
  const selected = useQuery({
    queryKey: ["linkedTrend", openId],
    queryFn: ({ signal }) => getTrend(openId!, signal),
    enabled: !!openId && !loaded,
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });
  // A shared URL can reference a product beyond the first page. Fetch its
  // story independently instead of changing the filtered grid to include it.
  const open = openId ? loaded ?? (selected.data?.id === openId ? selected.data : null) : null;

  return (
    <LayoutGroup>
      <ul aria-label="Products" className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {trends.map((trend, i) => (
          <ScrollReveal as="li" key={trend.id} index={i % batchSize} y={24} className="min-w-0">
            <TrendCard
              trend={trend}
              onOpen={(t) => {
                setLastOpenId(t.id);
                onOpenChange(t.id);
              }}
              archivedContext={archivedContext}
              onUnarchived={() => onUnarchived?.(trend.id)}
              priority={i < 3}
              activeLayout={activeLayoutId === trend.id}
            />
          </ScrollReveal>
        ))}
      </ul>
      {openId && !open && selected.isPending && <p role="status" className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-paper px-5 py-3 text-sm shadow-lift">Opening drop…</p>}
      <Dialog open={!!openId && !open && selected.isError} onOpenChange={(next) => { if (!next) onOpenChange(null); }}>
        <DialogContent className="rounded-2xl bg-paper text-ink">
          <DialogTitle className="font-display text-2xl">This drop couldn’t be opened.</DialogTitle>
          <DialogDescription>It may no longer be available, or the connection was interrupted. Your lane and filters are still here.</DialogDescription>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => { void selected.refetch(); }} className={ctaClass("primary")}>Try again</button>
            <button type="button" onClick={() => onOpenChange(null)} className={ctaClass("outline")}>Back to lane</button>
          </div>
        </DialogContent>
      </Dialog>
      <TrendDetail
        trend={open}
        onClose={() => onOpenChange(null)}
        onChanged={onTrendChanged}
        onDeleted={onTrendDeleted}
        archivedContext={archivedContext}
        onUnarchived={open ? () => onUnarchived?.(open.id) : undefined}
      />
    </LayoutGroup>
  );
}
