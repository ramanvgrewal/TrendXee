import { SITE_ORIGIN } from "./seo";

const aliases: Record<string, string> = {
  "/blog": "/journal", "/aesthetic/shoes": "/aesthetic/sneakers",
  "/aesthetic/footwear": "/aesthetic/sneakers",
  "/aesthetic/accessories": "/aesthetic/caps",
  "/aesthetic/polos-and-regular": "/aesthetic/tees",
  "/aesthetic/polos": "/aesthetic/tees",
  // The original TEES lane used "upper" before the category rename.
  "/aesthetic/upper": "/aesthetic/tees",
};

/**
 * Subcategories retired in the v3 restructure: lane -> old label -> [lane, new label].
 * A null label sends the visitor to the lane's subcategory chooser.
 */
const SUBCATEGORY_MOVES: Record<string, Record<string, [string, string | null]>> = {
  sportswear: { "Sports Shorts": ["bottoms", "Shorts & Jorts"], "Athleisure": ["sportswear", null] },
  caps: { "Beanies & Headwear": ["caps", "Caps & Headwear"], "Caps & Snapbacks": ["caps", "Caps & Headwear"] },
  shirts: { "Flannel & Check Shirts": ["shirts", "Overshirts & Flannels"], "Overshirts": ["shirts", "Overshirts & Flannels"] },
  bottoms: {
    "Joggers": ["bottoms", "Joggers & Sweatpants"], "Sweatpants": ["bottoms", "Joggers & Sweatpants"],
    "Parachute Pants": ["bottoms", "Cargo & Parachute Pants"], "Cargo Pants": ["bottoms", "Cargo & Parachute Pants"],
    "Shorts": ["bottoms", "Shorts & Jorts"],
  },
  jeans: { "Straight-Fit Jeans": ["jeans", "Relaxed & Straight Fit"] },
  // Every product in the old combined label was a hoodie or sweatshirt.
  outerwear: { "Hoodies & Winter Jackets": ["outerwear", "Hoodies & Sweatshirts"] },
};

const styleId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Old collection labels and style ids, matched case-insensitively. */
function movedSubcategory(lane: string, collection: string | null, style: string | null) {
  const moves = SUBCATEGORY_MOVES[lane];
  if (!moves) return;
  for (const [label, target] of Object.entries(moves)) {
    if ((collection && collection.trim().toLowerCase() === label.toLowerCase()) || (style && style.trim() === styleId(label))) return target;
  }
}

/** Normalize known aliases, never send unknown URLs to the home page. */
export function permanentRedirect(input: string, method = "GET"): string | undefined {
  if (!["GET", "HEAD"].includes(method)) return;
  const url = new URL(input);
  const originalPath = url.pathname;
  const path = originalPath.length > 1 ? originalPath.replace(/\/+$/, "") : originalPath;
  url.pathname = aliases[path] ?? (path.startsWith("/blog/") ? path.replace(/^\/blog\//, "/journal/") : path);
  if (path === "/aesthetic/polos" || path === "/aesthetic/polos-and-regular") {
    if (["oversized", "performance"].includes(url.searchParams.get("style") ?? "")) {
      url.searchParams.set("style", "polos");
    }
  }
  const lane = url.pathname.match(/^\/aesthetic\/([a-z-]+)$/)?.[1];
  const moved = lane && movedSubcategory(lane, url.searchParams.get("collection"), url.searchParams.get("style"));
  if (moved) {
    const [targetLane, label] = moved;
    url.pathname = `/aesthetic/${targetLane}`;
    url.searchParams.delete("style");
    url.searchParams.delete("page"); // A merged list has different pages.
    if (label) url.searchParams.set("collection", label);
    else url.searchParams.delete("collection");
  }
  if (["trendxee.com", "www.trendxee.com"].includes(url.hostname)) {
    const target = new URL(SITE_ORIGIN);
    url.protocol = target.protocol; url.host = target.host;
  }
  return url.href !== input ? url.href : undefined;
}
