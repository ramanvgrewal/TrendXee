import { useLocation, useRouterState } from "@tanstack/react-router";
import { breadcrumbSchema, jsonLd, type Crumb } from "@/lib/seo";
import { laneLabel } from "@/lib/format";

const pageNames: Record<string, string> = { "/lanes": "All lanes", "/about": "About", "/journal": "Journal", "/contact": "Contact", "/privacy": "Privacy", "/terms": "Terms of use", "/archive": "Your archive" };

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const matches = useRouterState({ select: state => state.matches });
  const data = matches.at(-1)?.loaderData as { aesthetic?: { id: string; name: string }; article?: { slug: string; title: string } } | undefined;
  if (matches.some(match => match.status === "notFound" || match._notFound)) return null;
  let items: Crumb[] = [{ name: "Home", path: "/" }];
  if (data?.aesthetic) items.push({ name: "All lanes", path: "/lanes" }, { name: laneLabel(data.aesthetic.name), path: `/aesthetic/${data.aesthetic.id}` });
  else if (data?.article) items.push({ name: "Journal", path: "/journal" }, { name: data.article.title, path: `/journal/${data.article.slug}` });
  else if (pageNames[pathname.replace(/\/$/, "")]) items.push({ name: pageNames[pathname.replace(/\/$/, "")], path: pathname.replace(/\/$/, "") });
  else return null;
  return <div className="mx-auto w-full max-w-[1440px] px-5 pt-4 sm:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(items)) }} />
    <nav aria-label="Breadcrumb" className="text-[11px] text-ink/60">
      <ol className="flex min-w-0 items-center gap-2">
        {items.map((item, index) => <li key={item.path} className="flex min-w-0 items-center gap-2">
          {index > 0 && <span aria-hidden className="text-ink/30">/</span>}
          {index === items.length - 1 ? <span aria-current="page" className="truncate">{item.name}</span>
            : <a href={item.path} className="inline-flex min-h-8 shrink-0 items-center underline-offset-4 hover:text-clay-ink hover:underline">{item.name}</a>}
        </li>)}
      </ol>
    </nav>
  </div>;
}
