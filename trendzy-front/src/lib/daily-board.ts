import type { RotationItem, RotationMap } from "@/lib/lanes";

const DAY_MS = 86_400_000;
const INDIA_OFFSET_MS = 19_800_000;

/** One shared India date for the server-rendered board, its label and hydration. */
export function indiaDateKey(now = new Date()) {
  return new Date(now.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function untilNextIndiaDay(now = new Date()) {
  return DAY_MS - ((now.getTime() + INDIA_OFFSET_MS) % DAY_MS);
}

export function productIdentity(item: RotationItem) {
  try {
    const url = new URL(item.shopUrl);
    const path = url.pathname.replace(/\/collections\/[^/]+\/products\//, "/products/").replace(/\/$/, "");
    const query = [...url.searchParams].filter(([key]) => /^(id|pid|product_id|productid)$/i.test(key)).sort();
    return `${url.hostname.replace(/^www\./, "")}${path}?${new URLSearchParams(query)}`;
  } catch { return item.id; }
}

function shuffle(items: RotationItem[], key: string) {
  let seed = 1;
  for (const char of key) seed = (Math.imul(31, seed) + char.charCodeAt(0)) >>> 0;
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

/** Stable within a day; the lead advances daily even when the catalog never changes. */
export function buildDailyBoard(rotationMap: RotationMap, dateKey = indiaDateKey()) {
  const unique = new Map<string, RotationItem>();
  for (const item of Object.values(rotationMap).flat().filter((p) => p.id && p.image && p.shopUrl).sort((a, b) => a.id.localeCompare(b.id))) {
    if (!unique.has(productIdentity(item))) unique.set(productIdentity(item), item);
  }
  const all = [...unique.values()];
  const covers = new Set(Object.values(rotationMap).flatMap((items) => items[0] ? [productIdentity(items[0])] : []));
  const alternatives = all.filter((item) => !covers.has(productIdentity(item)));
  const leadPool = alternatives.length >= 2 ? alternatives : all;
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / DAY_MS);
  const lead = leadPool.length ? leadPool[((day % leadPool.length) + leadPool.length) % leadPool.length] : undefined;
  const remaining = shuffle(all.filter((item) => !lead || productIdentity(item) !== productIdentity(lead)), dateKey);
  const dailyFive = remaining.slice(0, 5);
  const featured = new Set([...(lead ? [productIdentity(lead)] : []), ...dailyFive.map(productIdentity)]);
  const rising = risingToday(rotationMap, featured);
  const used = new Set([...featured, ...covers, ...rising.map(productIdentity)]);
  const rest = remaining.filter((item) => !used.has(productIdentity(item)));
  const story = rest.slice(0, 7);
  return { lead, dailyFive, rising, story };
}

export const RISING_COUNT = 8;

/**
 * A top-scored drop from each lane that isn't already the hero or in the Daily
 * Five, best first, favouring labels not shown yet. Lanes take turns, so a
 * small catalog still fills the row.
 */
function risingToday(rotationMap: RotationMap, taken: Set<string>) {
  const lanes = Object.keys(rotationMap).sort().map((lane) => {
    const seen = new Set<string>();
    return rotationMap[lane]
      .filter((item) => item.id && item.image && item.shopUrl && !taken.has(productIdentity(item)))
      .sort((a, b) => (b.score || 0) - (a.score || 0) || a.id.localeCompare(b.id))
      .filter((item) => !seen.has(productIdentity(item)) && !!seen.add(productIdentity(item)));
  });
  const picked = new Map<string, RotationItem>();
  const brands = new Set<string>();
  for (let progressed = true; progressed && picked.size < RISING_COUNT;) {
    progressed = false;
    for (const items of lanes) {
      if (picked.size >= RISING_COUNT) break;
      const open = items.filter((item) => !picked.has(productIdentity(item)));
      // One label shouldn't fill the row: prefer a brand not shown yet, else the lane's best.
      const item = open.find((candidate) => !candidate.brand || !brands.has(candidate.brand.toLowerCase())) ?? open[0];
      if (!item) continue;
      picked.set(productIdentity(item), item);
      if (item.brand) brands.add(item.brand.toLowerCase());
      progressed = true;
    }
  }
  return [...picked.values()].sort((a, b) => (b.score || 0) - (a.score || 0) || a.id.localeCompare(b.id));
}
