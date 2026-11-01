import { Link } from "@tanstack/react-router";
import { journalArticles } from "@/content/journal";

export function LaneReading({ laneId }: { laneId: string }) {
  const articles = journalArticles.filter((article) => article.relatedLanes?.includes(laneId));
  if (!articles.length) return null;

  return (
    <section aria-labelledby="lane-reading-title" className="mx-auto mt-14 w-full max-w-[1440px] px-5 sm:px-8">
      <div className="border-t border-border pt-8">
        <p className="eyebrow text-clay-ink">From the Journal</p>
        <h2 id="lane-reading-title" className="mt-3 font-display text-3xl">A note for your next fit.</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link to="/journal/$slug" params={{ slug: article.slug }} search={{ audience: undefined }} className="group block rounded-[18px] border border-border p-5 transition-colors hover:bg-raised sm:p-6">
                <h3 className="font-display text-xl leading-snug group-hover:text-clay-ink">
                  {article.seoTitle} <span aria-hidden>↗</span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{article.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
