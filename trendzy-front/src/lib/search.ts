import { apiUrl, CatalogRequestError, normalizeTrendList } from "@/lib/api";
import type { AudienceFilter } from "@/lib/audience";
import type { Trend } from "@/lib/mock-data";

export const SEARCH_PAGE_SIZE = 24;
export const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 2;

export type SearchBrand = { name: string; count: number };
/** A null label is a whole lane. */
export type SearchStyle = { category: string; label: string | null; count: number };
export type SearchResults = {
  brands: SearchBrand[];
  styles: SearchStyle[];
  trends: Trend[];
  total: number;
};

/** URL values can arrive parsed as numbers ("710"). */
export function normalizeSearchQuery(value: unknown): string {
  const text = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).trim();
}

export function isSearchable(query: string) {
  return query.length >= MIN_QUERY_LENGTH;
}

export function styleTarget(style: SearchStyle) {
  return { id: style.category.toLowerCase(), collection: style.label ?? undefined };
}

async function fetchSearch(query: string, audience: AudienceFilter, page: number, size: number, signal: AbortSignal): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query, audience, page: String(page - 1), size: String(size) });
  const response = await fetch(apiUrl(`/api/v2/search?${params}`), { signal });
  if (!response.ok) throw new CatalogRequestError(response.status);
  const data = await response.json();
  return {
    brands: Array.isArray(data.brands) ? data.brands : [],
    styles: Array.isArray(data.styles) ? data.styles : [],
    trends: normalizeTrendList(data),
    total: Number(data.totalElements) || 0,
  };
}

/** Runs in the browser only, so visitors never share the server's rate limit. */
export function searchQuery(query: string, audience: AudienceFilter, page = 1, size = SEARCH_PAGE_SIZE) {
  return {
    queryKey: ["search", query, audience, page, size] as const,
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchSearch(query, audience, page, size, signal),
    enabled: isSearchable(query),
    staleTime: 60_000,
    retry: (failures: number, error: Error) =>
      failures < 1 && !(error instanceof CatalogRequestError && error.status >= 400 && error.status < 500),
  };
}
