/**
 * Tags a retailer link so the brand can see TrendXee visits in its own store
 * analytics. Only the link a shopper follows is changed: the stored shopUrl
 * stays untouched because it is also the product's identity.
 */
export function retailerHref(shopUrl: string | undefined | null): string {
  if (!shopUrl) return "#";
  let url: URL;
  try {
    url = new URL(shopUrl);
  } catch {
    return shopUrl;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return shopUrl;
  // A retailer link that already carries campaign tags keeps them.
  if ([...url.searchParams.keys()].some((key) => key.toLowerCase().startsWith("utm_"))) return url.toString();
  url.searchParams.set("utm_source", "trendxee");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "product_discovery");
  return url.toString();
}
