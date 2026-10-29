import { apiUrl, normalizeTrend } from "@/lib/api";
import type { AudienceFilter } from "@/lib/audience";
import type { Trend } from "@/lib/mock-data";

export type PairingItem = { trend: Trend; identity: string; reason: string };
export type PairingSlot = { role: string; label: string; items: PairingItem[] };
export type PairingResult = { sourceIdentity: string; audience: AudienceFilter | "UNISEX"; needsAudience: boolean; slots: PairingSlot[];
  engine: "vision-v2" | "curation-pending"; outfitId?: string; modelVersion?: string; reason?: string;
  swappableRoles: string[]; impressionId?: string; feedbackToken?: string };
export type OutfitReceipt = Pick<PairingResult, 'outfitId' | 'impressionId' | 'feedbackToken'>;
export type PairingChoices = Record<string, { identity: string; seen: string[] }>;

export class PairingRequestError extends Error {
  constructor(public status: number) { super(`Pairings request failed (${status})`); }
}

/** Fail closed for legacy, partial or malformed sets: only reviewed whole outfits are displayed. */
export function normalizePairings(raw: any): PairingResult {
  if (!raw || typeof raw.sourceIdentity !== "string" || !raw.sourceIdentity) throw new Error("Missing pairing source identity");
  const seen = new Set([raw.sourceIdentity]);
  const roles = new Set<string>();
  const slots: PairingSlot[] = [];
  const input = Array.isArray(raw.slots) ? raw.slots : [];
  let complete = input.length >= 2 && input.length <= 3;
  for (const slot of input) {
    if (!['TOP', 'BOTTOM', 'LAYER', 'SHOES', 'HEADWEAR', 'BAG', 'BELT', 'JEWELRY', 'EYEWEAR'].includes(slot?.role)
      || typeof slot?.label !== "string" || roles.has(slot.role) || !Array.isArray(slot.items) || slot.items.length !== 1) { complete = false; continue; }
    const items: PairingItem[] = [];
    for (const item of Array.isArray(slot.items) ? slot.items : []) {
      if (typeof item?.identity !== "string" || !item.identity || seen.has(item.identity) || typeof item.reason !== "string" || !item.reason.trim()) continue;
      const trend = normalizeTrend(item.trend);
      const product = trend.products.underdog;
      if (!trend.id || !product?.imageUrl || !product.shopUrl || !Number.isFinite(product.price) || product.price <= 0) continue;
      if (!['MEN', 'WOMEN', 'UNISEX'].includes(product.audience ?? "")) continue;
      if (product.audience !== 'UNISEX' && product.audience !== raw.audience) continue;
      seen.add(item.identity);
      items.push({ trend, identity: item.identity, reason: item.reason.trim() });
      if (items.length === 4) break;
    }
    if (items.length) { roles.add(slot.role); slots.push({ role: slot.role, label: slot.label, items }); }
    else complete = false;
  }
  const reviewed = complete && ['MEN', 'WOMEN', 'UNISEX'].includes(raw.audience) && raw.needsAudience !== true && raw.engine === 'vision-v2'
    && typeof raw.outfitId === 'string' && !!raw.outfitId.trim();
  return {
    sourceIdentity: raw.sourceIdentity,
    audience: ['MEN', 'WOMEN', 'UNISEX'].includes(raw.audience) ? raw.audience : "ALL",
    needsAudience: raw.needsAudience === true,
    slots: reviewed ? slots : [],
    engine: reviewed ? 'vision-v2' : 'curation-pending',
    outfitId: reviewed ? raw.outfitId : undefined,
    modelVersion: reviewed && typeof raw.modelVersion === 'string' ? raw.modelVersion : undefined,
    reason: reviewed && typeof raw.reason === 'string' ? raw.reason.slice(0, 600) : undefined,
    swappableRoles: reviewed && Array.isArray(raw.swappableRoles) ? raw.swappableRoles.filter((role: unknown) => typeof role === 'string' && roles.has(role)) : [],
    impressionId: reviewed && typeof raw.impressionId === 'string' ? raw.impressionId : undefined,
    feedbackToken: reviewed && typeof raw.feedbackToken === 'string' ? raw.feedbackToken : undefined,
  };
}

export async function getPairings(source: Trend, audience: AudienceFilter, signal?: AbortSignal): Promise<PairingResult> {
  const query = new URLSearchParams({ audience, sourceIdentity: source.products.underdog?.shopUrl ?? "" });
  const response = await fetch(apiUrl(`/api/v2/trends/${encodeURIComponent(source.id)}/pairings?${query}`), { cache: "no-store", signal });
  if (!response.ok) throw new PairingRequestError(response.status);
  return normalizePairings(await response.json());
}

/** Another reviewed complete outfit with every non-swapped product locked. */
export async function getOutfitSwap(source: Trend, audience: AudienceFilter, current: PairingResult, role: string, seen: string[], signal?: AbortSignal): Promise<PairingResult> {
  const query = new URLSearchParams({ audience, sourceIdentity: source.products.underdog?.shopUrl ?? '', lookId: current.outfitId ?? '', swapRole: role });
  for (const identity of seen.slice(-40)) query.append('exclude', identity);
  const response = await fetch(apiUrl(`/api/v2/trends/${encodeURIComponent(source.id)}/pairings?${query}`), { cache: 'no-store', signal });
  if (!response.ok) throw new PairingRequestError(response.status);
  const next = normalizePairings(await response.json());
  if (next.engine !== 'vision-v2' || next.outfitId === current.outfitId || next.sourceIdentity !== current.sourceIdentity || next.audience !== current.audience || next.slots.length !== current.slots.length) throw new PairingRequestError(409);
  for (const slot of current.slots) {
    const changed = next.slots.find(s => s.role === slot.role);
    if (!changed || (slot.role !== role && changed.items[0].identity !== slot.items[0].identity)
      || (slot.role === role && (changed.items[0].identity === slot.items[0].identity || seen.includes(changed.items[0].identity)))) throw new PairingRequestError(409);
  }
  return next;
}

export function trackOutfit(receipt: OutfitReceipt, type: 'IMPRESSION' | 'CLICK' | 'SHOP_CLICK' | 'SAVE' | 'SWAP', trendId?: string) {
  if (!receipt.feedbackToken || typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem('trendxee:analytics') === 'off') return;
    let sessionId = window.sessionStorage.getItem('trendxee:outfit-session');
    if (!sessionId) { sessionId = crypto.randomUUID(); window.sessionStorage.setItem('trendxee:outfit-session', sessionId); }
    void fetch(apiUrl('/api/v2/outfits/events'), { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: receipt.feedbackToken, type, trendId, sessionId }) }).catch(() => {});
  } catch { /* Analytics failures never interrupt discovery. */ }
}

/** A refreshed trend ID can point at another product; validate before opening. */
export async function getPairingTrend(item: PairingItem, signal?: AbortSignal): Promise<Trend> {
  const query = new URLSearchParams({ sourceIdentity: item.identity });
  const response = await fetch(apiUrl(`/api/v2/trends/${encodeURIComponent(item.trend.id)}?${query}`), { cache: "no-store", signal });
  if (!response.ok) throw new PairingRequestError(response.status);
  const trend = normalizeTrend(await response.json());
  if (!trend.id || !trend.products.underdog?.shopUrl) throw new PairingRequestError(404);
  return trend;
}
