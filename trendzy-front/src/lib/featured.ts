import { apiFetch, normalizeTrend } from "@/lib/api";
import { aesthetics, type Trend } from "@/lib/mock-data";
import { belongsToLane, toRotationItem, type RotationItem } from "@/lib/lanes";
import type { AudienceFilter } from "@/lib/audience";

export type FeaturedPick = { date: string; trendId: string; note?: string };

/** Today's admin-chosen product (India date), or null when none is set or the API is unavailable. */
export async function getFeaturedToday(audience: AudienceFilter): Promise<RotationItem | null> {
  try {
    const response = await apiFetch("/api/v2/featured/today");
    if (response.status !== 200) return null;
    const body = await response.json();
    const trend: Trend = normalizeTrend(body?.trend);
    if (!trend.id || !trend.products.underdog?.imageUrl || !trend.products.underdog?.shopUrl) return null;
    const productAudience = trend.products.underdog.audience;
    // A Men-only pick should not lead the Women board, and the reverse.
    if (audience !== "ALL" && productAudience && productAudience !== "UNISEX" && productAudience !== audience) return null;
    const lane = aesthetics.find((a) => belongsToLane(trend, a.id))?.id ?? trend.aestheticId;
    return toRotationItem(trend, lane);
  } catch {
    return null;
  }
}

async function adminRequest(path: string, init: RequestInit) {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    let message = "That didn't save.";
    try { message = (await response.json())?.message || message; } catch { /* keep default */ }
    throw new Error(message);
  }
  return response;
}

export async function listFeaturedPicks(): Promise<FeaturedPick[]> {
  return (await adminRequest("/api/v2/featured", { method: "GET" })).json();
}

export async function setFeaturedPick(date: string, trendId: string, note?: string): Promise<FeaturedPick> {
  return (await adminRequest(`/api/v2/featured/${encodeURIComponent(date)}`, {
    method: "PUT",
    body: JSON.stringify({ trendId, note: note || undefined }),
  })).json();
}

export async function removeFeaturedPick(date: string): Promise<void> {
  await adminRequest(`/api/v2/featured/${encodeURIComponent(date)}`, { method: "DELETE" });
}
