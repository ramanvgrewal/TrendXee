import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { JournalCover } from "@/components/JournalCover";
import { journalArticles, journalDate, readingMinutes } from "@/content/journal";

export const Route = createFileRoute("/journal/")({
  head: () => pageSeo({ title: "Indian indie fashion & styling — TrendXee Journal", description: "Style guides, outfit ideas and field notes from TrendXee. Explore Indian indie fashion and find new ways to wear the pieces you discover.", path: "/journal" }),
  component: JournalPage,
});

function JournalPage() {
  const [featured, ...rest] = journalArticles;
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-10 sm:px-8 lg:pt-20">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8 sm:pb-12">
        <div>
          <p className="eyebrow text-clay-ink">Notes from the board</p>
          <h1 className="mt-4 font-display text-[clamp(3.5rem,8vw,8rem)] leading-[.95] tracking-[-.05em]">The <em className="text-clay">Journal.</em></h1>
        </div>
        <p className="max-w-xs text-base leading-relaxed text-ink/70">Good clothes. Smaller labels. A few notes on making them your own.</p>
      </header>

      <section aria-label="Latest story" className="py-8 sm:py-12">
        <Link to="/journal/$slug" params={{ slug: featured.slug }} className="group grid gap-7 rounded-[24px] outline-offset-8 md:grid-cols-2 lg:gap-16">
          <JournalCover article={featured} large />
          <div className="flex flex-col justify-center py-2 md:py-8">
            <p className="eyebrow text-clay-ink">01 / {featured.category}</p>
            <h2 className="mt-5 max-w-[15ch] font-display text-[clamp(2.3rem,4vw,4.5rem)] leading-[1.05] tracking-[-.035em] transition-colors group-hover:text-clay">{featured.title}</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink/70">{featured.excerpt}</p>
            <p className="mt-6 text-xs text-ink/60">{journalDate(featured.publishedAt)} · {readingMinutes(featured)} min read</p>
            <span className="mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-bold">Read the story <span aria-hidden className="transition-transform group-hover:translate-x-1">↗</span></span>
          </div>
        </Link>
      </section>

      <section aria-labelledby="more-notes" className="border-t border-border pt-8 sm:pt-12">
        <h2 id="more-notes" className="mb-7 font-display text-3xl tracking-tight">For your next fit</h2>
        <div className="grid gap-10 sm:grid-cols-2">
          {rest.map((article) => (
            <Link key={article.slug} to="/journal/$slug" params={{ slug: article.slug }} className="group min-w-0 rounded-[22px] outline-offset-8">
              <div className="h-72 sm:h-80"><JournalCover article={article} /></div>
              <p className="eyebrow mt-6 text-clay-ink">{article.category}</p>
              <h3 className="mt-3 max-w-lg font-display text-3xl leading-tight tracking-tight transition-colors group-hover:text-clay">{article.title}</h3>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-ink/70">{article.excerpt}</p>
              <p className="mt-5 text-xs text-ink/60">{journalDate(article.publishedAt)} · {readingMinutes(article)} min read <span aria-hidden>↗</span></p>
            </Link>
          ))}
        </div>
      </section>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-5 rounded-[22px] border border-border bg-raised p-6 sm:p-8">
        <p className="font-display text-2xl">Less reading. More finding your fit?</p>
        <Link to="/lanes" className="inline-flex min-h-11 items-center gap-3 font-bold text-clay-ink">Explore the lanes <span aria-hidden>→</span></Link>
      </div>
    </div>
  );
}
