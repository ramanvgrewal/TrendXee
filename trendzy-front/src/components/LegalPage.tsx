import type { ReactNode } from "react";

/** Shared reading layout for Terms and Privacy: contents rail + calm prose, no motion. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { id: string; heading: string; body: ReactNode }[];
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <p className="eyebrow text-ink/70">Legal</p>
      <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,5.5vw,4.75rem)] leading-[1] tracking-[-0.03em]">{title}</h1>
      <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink/70">{intro}</p>

      <div className="mt-16 grid gap-12 lg:grid-cols-12">
        <nav aria-label="Contents" className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow text-ink/70">Contents</p>
            <ol className="mt-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 py-2 text-[14px] text-ink/70 transition-colors hover:text-clay">
                    <span className="font-mono text-[11px] text-clay-ink">{String(i + 1).padStart(2, "0")}</span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="max-w-[68ch] space-y-14 lg:col-span-8 lg:col-start-5">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="font-display text-[1.9rem] leading-tight tracking-tight">{s.heading}</h2>
              <div className="mt-5 space-y-4 text-[16px] leading-[1.75] text-ink/75">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
