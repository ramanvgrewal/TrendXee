import { apiUrl, normalizeTrend } from "@/lib/api";
import type { AudienceFilter } from "@/lib/audience";
import type { Trend } from "@/lib/mock-data";

export type PairingItem = { trend: Trend; identity: string; reason: string };
export type PairingSlot = { role: string; label: string; items: PairingItem[] };
export type PairingResult = { sourceIdentity: string; audience: AudienceFilter | "UNISEX"; needsAudience: boolean; slots: PairingSlot[] };
export type PairingChoices = Record<string, { identity: string; seen: string[] }>;

export class PairingRequestError extends Error {
  constructor(public status: number) { super(`Pairings request failed (${status})`); }
}

/** Keep product identity attached to its own photo, story and supported reason. */
export function normalizePairings(raw: any): PairingResult {
  if (!raw || typeof raw.sourceIdentity !== "string" || !raw.sourceIdentity) throw new Error("Missing pairing source identity");
  const seen = new Set([raw.sourceIdentity]);
  const roles = new Set<string>();
  const slots: PairingSlot[] = [];
  for (const slot of Array.isArray(raw.slots) ? raw.slots : []) {
    if (typeof slot?.role !== "string" || typeof slot?.label !== "string" || roles.has(slot.role)) continue;
    const items: PairingItem[] = [];
    for (const item of Array.isArray(slot.items) ? slot.items : []) {
      if (typeof item?.identity !== "string" || !item.identity || seen.has(item.identity) || typeof item.reason !== "string" || !item.reason.trim()) continue;
      const trend = normalizeTrend(item.trend);
      const product = trend.products.underdog;
      if (!trend.id || !product?.imageUrl || !product.shopUrl || !Number.isFinite(product.price) || product.price <= 0) continue;
      if (!['MEN', 'WOMEN', 'UNISEX'].includes(product.audience ?? "")) continue;
      seen.add(item.identity);
      items.push({ trend, identity: item.identity, reason: item.reason.trim() });
      if (items.length === 4) break;
    }
    if (items.length) { roles.add(slot.role); slots.push({ role: slot.role, label: slot.label, items }); }
    if (slots.length === 3) break;
  }
  return {
    sourceIdentity: raw.sourceIdentity,
    audience: ['MEN', 'WOMEN', 'UNISEX'].includes(raw.audience) ? raw.audience : "ALL",
    needsAudience: raw.needsAudience === true,
    slots: raw.needsAudience === true ? [] : slots,
  };
}

export function chosenPairing(slot: PairingSlot, choices: PairingChoices): PairingItem {
  return slot.items.find((item) => item.identity === choices[slot.role]?.identity) ?? slot.items[0];
}

export function nextPairing(slot: PairingSlot, choices: PairingChoices, slots: PairingSlot[]): PairingItem | undefined {
  const current = chosenPairing(slot, choices);
  const used = new Set([current.identity, ...(choices[slot.role]?.seen ?? [])]);
  for (const other of slots) if (other.role !== slot.role) used.add(chosenPairing(other, choices).identity);
  return slot.items.find((item) => !used.has(item.identity));
}

export function advancePairing(slot: PairingSlot, choices: PairingChoices, slots: PairingSlot[]): PairingChoices {
  const next = nextPairing(slot, choices, slots);
  if (!next) return choices;
  const current = chosenPairing(slot, choices);
  return { ...choices, [slot.role]: { identity: next.identity, seen: [...new Set([...(choices[slot.role]?.seen ?? []), current.identity, next.identity])] } };
}

export async function getPairings(source: Trend, audience: AudienceFilter, signal?: AbortSignal): Promise<PairingResult> {
  const query = new URLSearchParams({ audience, sourceIdentity: source.products.underdog?.shopUrl ?? "" });
  const response = await fetch(apiUrl(`/api/v2/trends/${encodeURIComponent(source.id)}/pairings?${query}`), { cache: "no-store", signal });
  if (!response.ok) throw new PairingRequestError(response.status);
  return normalizePairings(await response.json());
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
