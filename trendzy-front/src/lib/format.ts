/** "₹2,799" in Indian grouping, or null when there is no usable price. */
export function formatPrice(price: number | null | undefined, currency?: string | null) {
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  const symbol = !currency || currency === "INR" ? "₹" : currency;
  return `${symbol}${Math.round(price).toLocaleString("en-IN")}`;
}

/** Whole-percent discount, only when it is real and meaningful. */
export function discountPercent(price?: number | null, original?: number | null) {
  if (!price || !original || original <= price) return null;
  const pct = Math.round(((original - price) / original) * 100);
  return pct >= 5 ? pct : null;
}

/** Display name for a lane id ("tees" → "Tees"). */
export function laneLabel(name: string) {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

/** "Sun, 4 Oct" for the India date — same on server and browser. */
export function indiaDateLabel(now = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);
}
