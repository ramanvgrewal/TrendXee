export type ProductAudience = "MEN" | "WOMEN" | "UNISEX";
export type AudienceFilter = "ALL" | "MEN" | "WOMEN";

export const AUDIENCE_OPTIONS: { value: AudienceFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
];

export function normalizeProductAudience(value: unknown): ProductAudience {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return normalized === "MEN" || normalized === "WOMEN" ? normalized : "UNISEX";
}

export function normalizeAudienceFilter(value: unknown): AudienceFilter {
  const audience = normalizeProductAudience(value);
  return audience === "MEN" || audience === "WOMEN" ? audience : "ALL";
}

export function matchesAudience(value: unknown, filter: AudienceFilter): boolean {
  if (filter === "ALL") return true;
  const audience = normalizeProductAudience(value);
  return audience === filter || (audience === "UNISEX" && (filter === "MEN" || filter === "WOMEN"));
}

export function audienceLabel(value: unknown): string {
  const audience = normalizeProductAudience(value);
  const labels = { MEN: "Men", WOMEN: "Women", UNISEX: "Unisex" };
  return labels[audience];
}
