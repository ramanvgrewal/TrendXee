import type { ProductMatch, ProductTriad, SignalProduct, Trend } from "@/lib/mock-data";
import { matchesAudience, normalizeProductAudience, type AudienceFilter } from "@/lib/audience";

const configuredBaseUrl =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : undefined);

const configuredBusinessUrl =
  import.meta.env?.VITE_BUSINESS_API_BASE_URL ||
  (typeof process !== "undefined" ? process.env?.VITE_BUSINESS_API_BASE_URL : undefined);

const localCatalog = import.meta.env?.DEV && (!configuredBaseUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredBaseUrl));
export const API_BASE_URL = localCatalog
  ? (typeof window === "undefined" ? (configuredBaseUrl || "http://localhost:8080").replace("localhost", "127.0.0.1") : configuredBaseUrl || "http://localhost:8080")
  : configuredBaseUrl || "https://api.trendxee.com";

export const BUSINESS_API_BASE_URL =
  configuredBusinessUrl || (import.meta.env?.DEV ? "http://localhost:8081" : "https://auth.trendxee.com");

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function businessApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BUSINESS_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function defaultHeaders(headers?: HeadersInit): HeadersInit {
  const merged = new Headers(headers);
  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }
  return merged;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(apiUrl(path), {
    ...init,
    headers: defaultHeaders(init.headers),
    credentials: "include",
  });
}

export function businessApiFetch(path: string, init: RequestInit = {}) {
  return fetch(businessApiUrl(path), {
    ...init,
    headers: defaultHeaders(init.headers),
    credentials: "include",
  });
}

export function getGoogleLoginUrl() {
  return businessApiUrl("/oauth2/authorization/google");
}

export function normalizeTrendList(payload: unknown): Trend[] {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { content?: unknown })?.content)
      ? (payload as { content: unknown[] }).content
      : [];

  return source.map(normalizeTrend);
}

export function normalizeTrend(raw: any): Trend {
  const signalProducts = normalizeSignalProducts(raw?.signalProducts);
  const productTriad = normalizeProductTriad(raw?.products ?? raw?.signalProducts);
  const category = String(raw?.aestheticId ?? raw?.category ?? "").trim().toLowerCase();
  const subcategory = raw?.subcategory;

  return {
    ...raw,
    id: String(raw?.id ?? ""),
    name: productTriad.underdog?.title?.trim() || raw?.trendName || raw?.name || "Untitled trend",
    aestheticId: category,
    subcategory: subcategory,
    trendScore: Number.isFinite(Number(raw?.brandHypeSignals?.followers)) && Number(raw?.brandHypeSignals?.followers) > 0
      && Number.isFinite(Number(raw?.trendScore)) ? Number(raw.trendScore) : 0,
    brandInstagramHandle: raw?.brandInstagramHandle,
    trendScoreUpdatedAt: raw?.trendScoreUpdatedAt,
    brandHypeSignals: raw?.brandHypeSignals,
    vibeTags: Array.isArray(raw?.vibeTags) ? raw.vibeTags : [],
    aiSummary: raw?.aiSummary ?? "",
    whyTrending: Array.isArray(raw?.whyTrending) ? raw.whyTrending : [],
    indiaRelevant: Boolean(raw?.indiaRelevant),
    totalSignals: Number(raw?.totalSignals ?? 0),
    supportingSignals: Array.isArray(raw?.supportingSignals)
      ? raw.supportingSignals
      : Array.isArray(raw?.supportingSignalIds)
        ? raw.supportingSignalIds
        : [],
    enrichmentStatus: raw?.enrichmentStatus ?? "COMPLETED",
    products: productTriad,
    signalProducts,
    estimatedPrice: Number(raw?.estimatedPrice ?? 0),
    lastUpdatedAt: raw?.lastUpdatedAt ?? "",
    active: raw?.active ?? true,
    underdogRating: raw?.underdogRating,
    ratingSignals: raw?.ratingSignals,
    userRatingAverage: raw?.userRatingAverage,
    userRatingCount: raw?.userRatingCount,
  };
}

function imageIdentity(value: string): string {
  try {
    const url = new URL(value);
    const asset = url.pathname.match(/^\/cdn\/shop\/(files|products)\/(.+)$/)
      ?? (/^cdn\.shopify(?:cdn)?\.(com|net)$/.test(url.hostname)
        ? url.pathname.match(/^\/s\/files\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/(files|products)\/(.+)$/) : null);
    if (asset) {
      const file = asset[2].replace(/_(?:\d+x\d*|pico|icon|thumb|small|compact|medium|large|grande|original)(?=\.[^.]+$)/, '');
      return `shopify:${asset[1]}/${file}?v=${url.searchParams.get('v') ?? ''}`;
    }
    return value;
  } catch { return value; }
}

function imageResolutionRank(value: string): number {
  if (!imageIdentity(value).startsWith("shopify:")) return 0;
  const url = new URL(value);
  const width = url.searchParams.get("width");
  if (width && /^\d+$/.test(width)) return Number(width);
  const size = url.pathname.match(/_(\d+)x\d*(?=\.[^.]+$)/);
  if (size) return Number(size[1]);
  if (/_(pico|icon|thumb|small|compact|medium|large|grande)(?=\.[^.]+$)/.test(url.pathname)) return 1;
  return Infinity;
}

export function normalizeProduct(raw: any): ProductMatch | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const positions = new Map<string, number>();
  const imageUrls: string[] = [];
  const candidates = [raw.imageUrl, ...(Array.isArray(raw.imageUrls) ? raw.imageUrls : [])]
    .filter((url): url is string => typeof url === "string" && !!url.trim())
    .map((url) => url.trim().startsWith("//") ? `https:${url.trim()}` : url.trim())
    .filter((url) => /^https?:\/\//i.test(url));
  for (const url of candidates) {
    const key = imageIdentity(url);
    const position = positions.get(key);
    if (position === undefined) {
      positions.set(key, imageUrls.length);
      imageUrls.push(url);
    } else if (imageResolutionRank(url) > imageResolutionRank(imageUrls[position])) {
      imageUrls[position] = url;
    }
  }
  return { ...raw, imageUrl: imageUrls[0] || "", imageUrls, audience: normalizeProductAudience(raw.audience) };
}

function normalizeProductTriad(raw: any): ProductTriad {
  return {
    underdog: normalizeProduct(raw?.underdog),
    amazon: normalizeProduct(raw?.amazon),
    flipkart: normalizeProduct(raw?.flipkart),
  };
}

function normalizeSignalProducts(raw: any): SignalProduct[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  return [raw as SignalProduct];
}

export async function getTrends(
  category: string,
  size = 100,
  subcategory?: string,
  page = 0,
  audience: AudienceFilter = "ALL",
): Promise<Trend[]> {
  const queryObj: Record<string, string> = {
    category,
    page: String(page),
    size: String(size),
    _t: String(Date.now()), // Force bypass of any browser/CDN cache (app caching happens in the router)
  };
  
  if (subcategory) {
    queryObj.subcategory = subcategory;
  }
  if (audience !== "ALL") queryObj.audience = audience;
  
  const params = new URLSearchParams(queryObj);
  const response = await fetchCatalog(`/api/v2/trends?${params.toString()}`);

  // Guard older responses too. Unknown fits are shared as unisex; a model's
  // appearance in a product photo must not determine the product's audience.
  return normalizeTrendList(await response.json()).filter((trend) => matchesAudience(trend.products.underdog?.audience, audience));
}

export class CatalogRequestError extends Error {
  constructor(public status: number) { super(`Catalog request failed (${status})`); }
}

/** One bounded retry for transient outages; no dependency on AbortSignal.timeout support. */
async function fetchCatalog(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await fetch(apiUrl(path), { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new CatalogRequestError(response.status);
        return response;
      } catch (error) {
        const retryable = !(error instanceof CatalogRequestError) || [408, 429, 500, 502, 503, 504].includes(error.status);
        if (attempt > 0 || !retryable || controller.signal.aborted) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  } finally { clearTimeout(timeout); }
}

export async function getTrend(id: string, signal?: AbortSignal): Promise<Trend> {
  const response = await fetch(apiUrl(`/api/v2/trends/${encodeURIComponent(id)}`), { cache: "no-store", signal });
  if (!response.ok) throw new CatalogRequestError(response.status);
  return normalizeTrend(await response.json());
}

/** The lane feed requests facets from the whole category, not just its first page. */
export async function getCatalogPage(
  category: string, size: number, page: number, audience: AudienceFilter,
  filters: { style?: string; subcategory?: string; minPrice?: number; maxPrice?: number } = {},
  includeFilters = true,
) {
  const params = new URLSearchParams({ category, size: String(size), page: String(page), audience, includeFilters: String(includeFilters) });
  if (filters.subcategory) params.set("subcategory", filters.subcategory);
  if (filters.style) params.set("style", filters.style);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  const response = await fetchCatalog(`/api/v2/trends?${params}`);
  const data = await response.json();
  const trends = normalizeTrendList(data).filter((trend) => matchesAudience(trend.products.underdog?.audience, audience));
  return {
    trends,
    total: typeof data.totalElements === "number" ? data.totalElements : undefined,
    hasMore: typeof data.hasMore === "boolean" ? data.hasMore : trends.length === size,
    styles: (Array.isArray(data.styles) ? data.styles.filter((value: any) => typeof value?.id === "string" && typeof value?.label === "string") : []) as { id: string; label: string }[],
  };
}

export async function rateTrendProduct(trendId: string, rating: number) {
  const response = await apiFetch(`/api/products/${trendId}/rate`, {
    method: "POST",
    body: JSON.stringify({ rating })
  });
  if (!response.ok) throw new Error("Failed to submit rating");
  return normalizeTrend(await response.json());
}

export interface BrandReview {
  id?: string;
  brandName: string;
  userId?: string;
  comment: string;
  createdAt?: string;
}

export async function getBrandComments(brandName: string): Promise<BrandReview[]> {
  const response = await apiFetch(`/api/brands/${encodeURIComponent(brandName)}/comments`);
  if (!response.ok) throw new Error("Failed to fetch brand comments");
  return response.json();
}

export async function addBrandComment(brandName: string, comment: string): Promise<BrandReview> {
  const response = await apiFetch(`/api/brands/${encodeURIComponent(brandName)}/comments`, {
    method: "POST",
    body: JSON.stringify({ comment })
  });
  if (!response.ok) throw new Error("Failed to submit comment");
  return response.json();
}

