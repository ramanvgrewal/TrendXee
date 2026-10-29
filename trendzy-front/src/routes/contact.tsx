import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ContactForm } from "@/components/ContactForm";
import { currentUserQuery } from "@/lib/user";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => pageSeo({ title: "Contact TrendXee — Questions, feedback & brands", description: "Contact TrendXee with a question, feedback, a bug report or an Indian fashion label we should discover. No account is required.", path: "/contact" }),
  component: ContactPage,
});

function ContactPage() {
  const { data: user } = useQuery(currentUserQuery);
  return <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-20">
    <header>
      <p className="eyebrow text-clay-ink">A note to the board</p>
      <h1 className="mt-4 font-display text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight">Let's <em className="text-clay">talk.</em></h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">A brand we should know, a question about the board, or something that isn't working? We'd like to hear it.</p>
      <a className="mt-5 inline-flex min-h-11 items-center text-clay-ink underline underline-offset-4" href="mailto:hello@trendxee.com">hello@trendxee.com</a>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/65">For orders, delivery and returns, contact the retailer you bought from. TrendXee helps you discover products; the store handles your purchase.</p>
    </header>
    <section aria-label="Send a message" className="rounded-3xl border border-border bg-raised p-6 sm:p-8"><ContactForm email={user?.email} /></section>
  </div>;
}
