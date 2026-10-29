import { createFileRoute } from "@tanstack/react-router";
import { journalArticles } from "@/content/journal";
import { aesthetics } from "@/lib/mock-data";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = ["/", "/lanes", "/about", "/journal", "/contact", "/privacy", "/terms", ...aesthetics.map((lane) => `/aesthetic/${lane.id}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${absoluteUrl(path)}</loc></url>`).join("")}${journalArticles.map(article => `<url><loc>${absoluteUrl(`/journal/${article.slug}`)}</loc><lastmod>${article.publishedAt}</lastmod></url>`).join("")}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
