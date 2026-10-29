import { pageSeo, notFoundSeo } from "@/lib/seo";
import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JournalCover } from "@/components/JournalCover";
import { ctaClass } from "@/components/Cta";
import { findJournalArticle, journalArticles, journalDate, readingMinutes } from "@/content/journal";

export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const article = findJournalArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return notFoundSeo();
    const { article } = loaderData;
    const seo = pageSeo({ title: `${article.title} — TrendXee Journal`, description: article.excerpt, path: `/journal/${article.slug}`, type: "article" });
    return { ...seo, meta: [...seo.meta, { name: "author", content: article.author }, { property: "article:published_time", content: `${article.publishedAt}T00:00:00+05:30` }] };
  },
  component: JournalArticlePage,
});

function JournalArticlePage() {
  const { article } = Route.useLoaderData();
  const [shareStatus, setShareStatus] = useState("");
  const url = `https://www.trendxee.com/journal/${article.slug}`;
  const related = journalArticles.filter((item) => item.slug !== article.slug).slice(0, 2);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: article.title, url });
      else { await navigator.clipboard.writeText(url); setShareStatus("Link copied"); }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setShareStatus("Copy the page address to share this story.");
    }
  };
  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-8 sm:px-8 lg:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title,
        description: article.excerpt, datePublished: `${article.publishedAt}T00:00:00+05:30`,
        author: { "@type": article.author === "Raman Grewal" ? "Person" : "Organization", name: article.author },
        publisher: { "@type": "Organization", name: "TrendXee", url: "https://www.trendxee.com" },
        mainEntityOfPage: url, image: "https://www.trendxee.com/og-trendxee.png",
      }).replace(/</g, "\\u003c") }} />
      <Link to="/journal" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink/70 hover:text-clay">← The Journal</Link>
      <header className="mx-auto max-w-4xl pb-10 pt-5 sm:pb-14 sm:pt-10">
        <p className="eyebrow text-clay-ink">{article.category}</p>
        <h1 className="mt-5 text-balance font-display text-[clamp(2.7rem,5.5vw,5.5rem)] leading-[1.02] tracking-[-.04em]">{article.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{article.excerpt}</p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-ink/65">
          <p>{article.author} · <time dateTime={article.publishedAt}>{journalDate(article.publishedAt)}</time> · {readingMinutes(article)} min read</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={share} className="min-h-11 font-bold text-clay-ink">Share story ↗</button>
            <span role="status" className="max-w-56">{shareStatus}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto h-72 max-w-4xl sm:h-96 lg:h-[440px]"><JournalCover article={article} large /></div>
      <div className="mt-10 grid items-start gap-8 lg:mt-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24">
          <details className="rounded-[18px] border border-border p-5 lg:hidden">
            <summary className="min-h-6 cursor-pointer text-sm font-bold">In this story</summary>
            <nav aria-label="Article contents" className="mt-3">
              {article.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="flex min-h-11 items-center py-2 text-sm leading-snug text-ink/65 hover:text-clay">{section.title}</a>)}
            </nav>
          </details>
          <nav aria-label="Article contents" className="hidden rounded-[18px] border border-border p-5 lg:block">
            <p className="text-sm font-bold">In this story</p>
            {article.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="mt-2 flex min-h-11 items-center py-2 text-sm leading-snug text-ink/65 hover:text-clay">{section.title}</a>)}
          </nav>
        </aside>
        <article aria-label={article.title} className="min-w-0 max-w-[700px]">
          <p className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] leading-relaxed text-ink/85">{article.introduction}</p>
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 pt-10 sm:pt-12">
              <h2 className="font-display text-[clamp(1.8rem,3vw,2.3rem)] leading-tight tracking-tight">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-[17px] leading-[1.85] text-ink/75 sm:text-lg">{paragraph}</p>)}
              {section.tips && <ul className="mt-6 space-y-3 rounded-[18px] border border-border bg-raised p-5 sm:p-6">{section.tips.map((tip) => <li key={tip} className="flex gap-3 text-base leading-relaxed text-ink/80"><span aria-hidden className="text-clay">↗</span>{tip}</li>)}</ul>}
            </section>
          ))}
          <div className="mt-10 rounded-[22px] border border-border bg-raised p-6 sm:p-8">
            <p className="eyebrow text-clay-ink">Put it into practice</p>
            <p className="mt-3 font-display text-2xl">Find a piece to make your own.</p>
            <Link to="/aesthetic/$id" params={{ id: article.lane }} className={`${ctaClass("primary", "sm")} mt-5`}>{article.laneLabel} →</Link>
          </div>
        </article>
      </div>
      <section aria-labelledby="keep-reading" className="mt-16 border-t border-border pt-10 sm:mt-24">
        <h2 id="keep-reading" className="font-display text-3xl">One more note</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">{related.map((item) => (
          <Link key={item.slug} to="/journal/$slug" params={{ slug: item.slug }} className="rounded-[20px] border border-border p-6 transition-colors hover:bg-raised">
            <p className="eyebrow text-clay-ink">{item.category}</p><h3 className="mt-3 font-display text-2xl leading-tight">{item.title}</h3><p className="mt-4 text-sm text-ink/65">{readingMinutes(item)} min read <span aria-hidden>↗</span></p>
          </Link>
        ))}</div>
      </section>
    </div>
  );
}
