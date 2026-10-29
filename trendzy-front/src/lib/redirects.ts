import { SITE_ORIGIN } from "./seo";

const aliases: Record<string, string> = {
  "/blog": "/journal", "/aesthetic/shoes": "/aesthetic/sneakers",
  "/aesthetic/accessories": "/aesthetic/caps", "/aesthetic/polos-and-regular": "/aesthetic/polos",
};

/** Normalize known aliases, never send unknown URLs to the home page. */
export function permanentRedirect(input: string, method = "GET"): string | undefined {
  if (!["GET", "HEAD"].includes(method)) return;
  const url = new URL(input);
  const originalPath = url.pathname;
  const path = originalPath.length > 1 ? originalPath.replace(/\/+$/, "") : originalPath;
  url.pathname = aliases[path] ?? (path.startsWith("/blog/") ? path.replace(/^\/blog\//, "/journal/") : path);
  if (["trendxee.com", "www.trendxee.com"].includes(url.hostname)) {
    const target = new URL(SITE_ORIGIN);
    url.protocol = target.protocol; url.host = target.host;
  }
  return url.href !== input ? url.href : undefined;
}
