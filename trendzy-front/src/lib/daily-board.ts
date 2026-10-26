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

function identity(item: RotationItem) {
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
    if (!unique.has(identity(item))) unique.set(identity(item), item);
  }
  const all = [...unique.values()];
  const covers = new Set(Object.values(rotationMap).flatMap((items) => items[0] ? [identity(items[0])] : []));
  const alternatives = all.filter((item) => !covers.has(identity(item)));
  const leadPool = alternatives.length >= 2 ? alternatives : all;
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / DAY_MS);
  const lead = leadPool.length ? leadPool[((day % leadPool.length) + leadPool.length) % leadPool.length] : undefined;
  const remaining = shuffle(all.filter((item) => !lead || identity(item) !== identity(lead)), dateKey);
  const dailyFive = remaining.slice(0, 5);
  const used = new Set([...(lead ? [identity(lead)] : []), ...dailyFive.map(identity), ...covers]);
  const rest = remaining.filter((item) => !used.has(identity(item)));
  const story = rest.slice(0, 7);
  const underdog = rest.slice(7).find((item) => item.mainstream?.image);
  return { lead, dailyFive, story, underdog };
}
