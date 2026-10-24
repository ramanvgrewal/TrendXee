/** Category URLs store only the broad style family. Retired price/raw-style links cannot hide results. */
export type LaneFilters = { style?: string };
export type StyleOption = { id: string; label: string };

/** URLs are one-based. Invalid, fractional and unbounded page values start at page one. */
export function normalizeLanePage(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") return 1;
  if (typeof value === "string" && !/^[1-9]\d{0,5}$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1;
}

/** Keep every numbered page in short lanes; collapse longer lists around the current page. */
export function lanePageItems(page: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total]);
  const start = Math.max(2, Math.min(page - 1, total - 4));
  const end = Math.min(total - 1, Math.max(page + 1, 5));
  for (let n = start; n <= end; n++) pages.add(n);
  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const n of [...pages].filter((n) => n > 0 && n <= total).sort((a, b) => a - b)) {
    if (previous && n - previous > 1) result.push("gap");
    result.push(n);
    previous = n;
  }
  return result;
}

export function normalizeLaneFilters(search: Record<string, unknown>): LaneFilters {
  const style = typeof search.style === "string" ? search.style.trim() : "";
  return /^[a-z][a-z-]{0,39}$/.test(style) ? { style } : {};
}
