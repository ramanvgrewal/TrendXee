import type { LaneFilters, StyleOption } from "@/lib/lane-filters";

const styles = new Map<string, StyleOption[]>();
const failures = new Set<string>();
function key(lane: string, audience: string, filters: LaneFilters & { page?: number }) { return `${lane}:${audience}:${filters.style || ""}:${filters.page || 1}`; }

export function cachedStyles(lane: string) { return styles.get(lane) || []; }
export function rememberStyles(lane: string, options: StyleOption[]) { if (options.length) styles.set(lane, options); }
export function hasCatalogFailure(lane: string, audience: string, filters: LaneFilters & { page?: number }) { return failures.has(key(lane, audience, filters)); }
export function markCatalogFailure(lane: string, audience: string, filters: LaneFilters & { page?: number }, failed: boolean) {
  const id = key(lane, audience, filters);
  if (!failed) { failures.delete(id); return; }
  if (failures.size >= 128) failures.delete(failures.values().next().value!);
  failures.add(id);
}
