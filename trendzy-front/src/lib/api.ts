import type { ProductTriad, SignalProduct, Trend } from "@/lib/mock-data";

const configuredBaseUrl =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : undefined);

const configuredBusinessUrl =
  import.meta.env?.VITE_BUSINESS_API_BASE_URL ||
  (typeof process !== "undefined" ? process.env?.VITE_BUSINESS_API_BASE_URL : undefined);

export const API_BASE_URL =
  configuredBaseUrl || (import.meta.env?.DEV ? "http://localhost:8080" : "https://api.trendxee.com");

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
  const category = String(raw?.aestheticId ?? raw?.category ?? "").toLowerCase();
  const subcategory = raw?.subcategory;

  return {
    ...raw,
    id: String(raw?.id ?? ""),
    name: raw?.trendName ?? raw?.name ?? "Untitled trend",
    aestheticId: category,
    subcategory: subcategory,
    trendScore: Number(raw?.trendScore ?? 0),
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

function normalizeProductTriad(raw: any): ProductTriad {
  return {
    underdog: raw?.underdog,
    amazon: raw?.amazon,
    flipkart: raw?.flipkart,
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
  
  const params = new URLSearchParams(queryObj);
  const response = await fetch(apiUrl(`/api/v2/trends?${params.toString()}`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trends (${response.status})`);
  }

  return normalizeTrendList(await response.json());
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

