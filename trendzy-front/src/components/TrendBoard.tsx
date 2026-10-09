import { useEffect, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { TrendCard } from "@/components/TrendCard";
import { TrendDetail } from "@/components/TrendDetail";
import { ScrollReveal } from "@/motion/ScrollReveal";
import type { Trend } from "@/lib/mock-data";

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
  const open = openId ? trends.find((t) => t.id === openId) ?? null : null;

  return (
    <LayoutGroup>
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {trends.map((trend, i) => (
          <ScrollReveal as="li" key={trend.id} index={i % batchSize} y={24}>
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
