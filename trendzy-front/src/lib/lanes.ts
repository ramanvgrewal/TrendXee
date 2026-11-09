import { getCatalogPage } from "@/lib/api";
import { productIdentity } from "@/lib/daily-board";
import type { LaneFilters } from "@/lib/lane-filters";
import { cachedStyles, markCatalogFailure, rememberStyles } from "@/lib/catalog-state";
import { aesthetics, type Trend } from "@/lib/mock-data";
import type { AudienceFilter, ProductAudience } from "@/lib/audience";

export type RotationItem = {
  /** Trend id (for click tracking). */
  id: string;
  brand: string;
  title: string;
  image: string;
  imageUrls?: string[];
  shopUrl: string;
  category?: string;
  trendName: string;
  /** First sentence or two of the AI summary. */
  summary: string;
  score: number;
  price?: number;
  originalPrice?: number;
  currency?: string;
  subcategory?: string;
  audience?: ProductAudience;
};

function shortSummary(text: string, max = 190) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).length > max) break;
    out += sentence;
  }
  return (out || clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…").trim();
}

function toRotationItem(t: Trend, laneId: string): RotationItem {
  const u = t.products.underdog!;
  return {
    id: t.id,
    brand: u.brandName || "",
    title: u.title || "",
    image: u.imageUrl || "",
    imageUrls: u.imageUrls,
    shopUrl: u.shopUrl || "",
    category: laneId,
    trendName: t.name,
    summary: shortSummary(t.aiSummary),
    score: Math.round(t.trendScore || 0),
    price: u.price || undefined,
    originalPrice: u.originalPrice || undefined,
    currency: u.currency || undefined,
    subcategory: t.subcategory || undefined,
    audience: u.audience,
  };
}

export type RotationMap = Record<string, RotationItem[]>;

/** Trend cards fetched per page on a lane. The backend sorts by score. */
export const LANE_PAGE_SIZE = 12;

/** Loader data on lane routes stays fresh this long; hover-prefetch reuses it. */
export const LANE_STALE_TIME = 5 * 60_000;

/** Match the public API's lane aliases without changing stored product categories. */
const LANE_CATEGORIES: Record<string, string[]> = {
  caps: ["caps", "accessories", "watches"],
  tees: ["tees", "polos"],
};

export function belongsToLane(trend: Trend, laneId: string) {
  const allowed = LANE_CATEGORIES[laneId] ?? [laneId];
  return allowed.includes(trend.aestheticId);
}

/** One page of a lane's trends, plus whether another page is worth asking for. */
export async function fetchLanePage(laneId: string, page: number, audience: AudienceFilter = "ALL", filters: LaneFilters = {}) {
  try {
    const result = await getCatalogPage(laneId, LANE_PAGE_SIZE, page, audience, { style: filters.style });
    rememberStyles(laneId, result.styles);
    markCatalogFailure(laneId, audience, { ...filters, page: page + 1 }, false);
    return { ...result, styles: result.styles.length ? result.styles : cachedStyles(laneId), trends: result.trends.filter((t) => belongsToLane(t, laneId)) };
  } catch (error) {
    markCatalogFailure(laneId, audience, { ...filters, page: page + 1 }, true);
    throw error;
  }
}

export const LANE_COVER_STALE_TIME = 60_000;
const rotationCache = new Map<AudienceFilter, { at: number; data: Promise<RotationMap> }>();

/**
 * Up to fifteen underdog products per lane, used by the home hero and lane
 * posters. One failing lane no longer blanks the others. Shared in memory
 * for 60s to avoid repeat catalog requests.
 */
export function fetchLaneRotations(audience: AudienceFilter = "ALL"): Promise<RotationMap> {
  const cached = rotationCache.get(audience);
  if (cached && Date.now() - cached.at < LANE_COVER_STALE_TIME) {
    return cached.data;
  }

  const data = Promise.allSettled(
    aesthetics.map(async (a) => {
      // The catalog response applies the lane's current style rules on older API deployments too.
      const { trends } = await getCatalogPage(a.id, 15, 0, audience);
      const items = trends
        .filter((t) => belongsToLane(t, a.id) && t.products?.underdog?.imageUrl && t.products?.underdog?.shopUrl)
        .map((t) => toRotationItem(t, a.id));
      const seen = new Set<string>();
      return [a.id, items.filter((item) => {
        const key = productIdentity(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })] as const;
    }),
  ).then((results) => {
    const map: RotationMap = {};
    for (const result of results) {
      if (result.status === "fulfilled") {
        const [id, items] = result.value;
        map[id] = items;
      } else {
        console.error("Failed to fetch lane rotation", result.reason);
      }
    }
    // A partial outage must not pin missing lanes into the home cache during the next refresh.
    if (results.some((result) => result.status === "rejected") && rotationCache.get(audience)?.data === data) {
      rotationCache.delete(audience);
    }
    return map;
  });

  rotationCache.set(audience, { at: Date.now(), data });
  data.catch(() => {
    if (rotationCache.get(audience)?.data === data) rotationCache.delete(audience);
  });
  return data;
}
