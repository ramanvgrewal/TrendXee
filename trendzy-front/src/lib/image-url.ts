// Only public image CDNs are accepted by our thumbnail endpoint.
export const IMAGE_HOSTS = new Set(["cdn.shopify.com", "static.wixstatic.com", "images.unsplash.com", "images.pexels.com", "assets.myntassets.com"]);
export const IMAGE_WIDTHS = [160, 320, 640, 960, 1440, 1920] as const;

export function thumbnailSource(source: string | null | undefined, width = 960) {
  if (!source) return "";
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !IMAGE_HOSTS.has(url.hostname)) return source;
    if (/\.svg(?:$|\?)/i.test(url.pathname)) return source;
    const size = IMAGE_WIDTHS.find(value => value >= width) ?? 1920;
    return `/image?${new URLSearchParams({ src: source, w: String(size) })}`;
  } catch { return source; }
}
