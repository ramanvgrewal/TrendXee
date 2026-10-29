export const SITE_ORIGIN = "https://www.trendxee.com";
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/og-trendxee.png`;

export function absoluteUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Expected a site-relative path");
  return `${SITE_ORIGIN}${path}`;
}

export function pageSeo({ title, description, path, noindex = false, type = "website" }: {
  title: string; description: string; path?: string; noindex?: boolean; type?: string;
}) {
  const url = path ? absoluteUrl(path) : undefined;
  return {
    meta: [
      { title }, { name: "description", content: description },
      { name: "robots", content: noindex ? "noindex, follow" : "index, follow, max-image-preview:large" },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: type }, { property: "og:site_name", content: "TrendXee" },
      { property: "og:locale", content: "en_IN" },
      ...(url ? [{ property: "og:url", content: url }] : []),
      { property: "og:image", content: SOCIAL_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "TrendXee — Discover Indian indie fashion. Fits before they go viral." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title }, { name: "twitter:description", content: description },
      { name: "twitter:image", content: SOCIAL_IMAGE },
      { name: "twitter:image:alt", content: "TrendXee — Indian indie fashion discovery" },
    ],
    links: url ? [{ rel: "canonical", href: url }] : [],
  };
}

export const notFoundSeo = () => pageSeo({
  title: "Page not found — TrendXee", description: "This page isn't on the board. Explore TrendXee's fashion lanes and Journal.", noindex: true,
});

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_ORIGIN}/#organization`, name: "TrendXee", url: `${SITE_ORIGIN}/`,
      description: "Discover Indian indie fashion brands and build outfits from the products on the board.",
      logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/brand/trendxee-mark.png` },
      email: "hello@trendxee.com",
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "hello@trendxee.com", url: `${SITE_ORIGIN}/contact` },
    },
    { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "TrendXee", alternateName: "Trendxee", url: `${SITE_ORIGIN}/`,
      publisher: { "@id": `${SITE_ORIGIN}/#organization` } },
  ],
};

export type Crumb = { name: string; path: string };
export function breadcrumbSchema(items: Crumb[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

/** Only pagination changes the canonical list page. Filters and open dialogs are not landing pages. */
export function laneSeo(id: string, name: string, description: string, search: { page?: number; audience?: string; style?: string; trend?: string }) {
  const page = Math.max(1, search.page ?? 1);
  const filtered = !!search.style || (!!search.audience && search.audience !== "ALL");
  const context = [search.audience && search.audience !== "ALL" ? search.audience === "MEN" ? "Men" : "Women" : "", search.style ?? "", page > 1 ? `Page ${page}` : ""].filter(Boolean);
  return pageSeo({ title: `${name}${context.length ? ` · ${context.join(" · ")}` : ""} — TrendXee`,
    description: `${description}${page > 1 ? ` Browse page ${page} of the current ${name.toLowerCase()} collection.` : ""}`,
    path: `/aesthetic/${id}${!filtered && page > 1 ? `?page=${page}` : ""}`, noindex: filtered || !!search.trend });
}
