import { getTrends } from "@/lib/api";
import { aesthetics, type Trend } from "@/lib/mock-data";

export type RotationItem = {
  brand: string;
  title: string;
  image: string;
  shopUrl: string;
  category?: string;
};

export type RotationMap = Record<string, RotationItem[]>;

/** Trend cards fetched per page on a lane. The backend sorts by score. */
export const LANE_PAGE_SIZE = 12;

/** Loader data on lane routes stays fresh this long; hover-prefetch reuses it. */
export const LANE_STALE_TIME = 5 * 60_000;

/**
 * Backend categories each lane is allowed to show. The API widens CAPS to
 * CAPS + ACCESSORIES, so the lane must accept both or accessories vanish.
 */
const LANE_CATEGORIES: Record<string, string[]> = {
  caps: ["caps", "accessories"],
};

export function belongsToLane(trend: Trend, laneId: string) {
  const allowed = LANE_CATEGORIES[laneId] ?? [laneId];
  return allowed.includes(trend.aestheticId);
}

/** One page of a lane's trends, plus whether another page is worth asking for. */
export async function fetchLanePage(laneId: string, page: number) {
  const raw = await getTrends(laneId, LANE_PAGE_SIZE, undefined, page);
  return {
    trends: raw.filter((t) => belongsToLane(t, laneId)),
    hasMore: raw.length === LANE_PAGE_SIZE,
  };
}

const ROTATION_TTL = 5 * 60_000;
let rotationCache: { at: number; data: Promise<RotationMap> } | null = null;

/**
 * Up to five underdog products per lane, used by the home hero and lane
 * posters. One failing lane no longer blanks the others. In the browser the
 * result is shared between / and /lanes for a few minutes.
 */
export function fetchLaneRotations(): Promise<RotationMap> {
  const inBrowser = typeof window !== "undefined";
  if (inBrowser && rotationCache && Date.now() - rotationCache.at < ROTATION_TTL) {
    return rotationCache.data;
  }

  const data = Promise.allSettled(
    aesthetics.map(async (a) => {
      const trends = await getTrends(a.id, 15);
      const items = trends
        .filter((t) => t.products?.underdog?.imageUrl && t.products?.underdog?.shopUrl)
        .slice(0, 5)
        .map((t) => ({
          brand: t.products.underdog?.brandName || "",
          title: t.products.underdog?.title || "",
          image: t.products.underdog?.imageUrl || "",
          shopUrl: t.products.underdog?.shopUrl || "",
          category: a.id,
        }));
      return [a.id, items] as const;
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
    return map;
  });

  if (inBrowser) {
    rotationCache = { at: Date.now(), data };
    data.catch(() => {
      rotationCache = null;
    });
  }
  return data;
}

/** Today's date in India, e.g. "2026-10-04" — identical on server and browser. */
export function indiaDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The Daily Five: a seeded shuffle of every lane's products that changes at
 * midnight IST. Computed in the route loader, so the server-rendered hero and
 * the hydrated hero always agree (the old version used the machine's local
 * date — UTC on the server, IST in the browser).
 */
export function pickDailyFive(rotationMap: RotationMap, dateKey = indiaDateKey()): RotationItem[] {
  const all = Object.values(rotationMap).flat();

  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (Math.imul(31, seed) + dateKey.charCodeAt(i)) | 0;
  }
  seed = Math.abs(seed) || 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 5);
}
