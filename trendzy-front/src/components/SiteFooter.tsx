import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthModal } from "@/components/AuthModal";
import { ContactDialog } from "@/components/ContactDialog";
import { currentUserQuery } from "@/lib/user";
import { aesthetics } from "@/lib/mock-data";
import { laneLabel } from "@/lib/format";

export function SiteFooter() {
  const { data: user } = useQuery(currentUserQuery);
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const linkClass = "text-[14px] text-ink/65 transition-colors hover:text-clay";

  return (
    <footer className="relative border-t border-border bg-cream/40">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="size-8 object-contain" />
            <span className="font-display text-2xl tracking-tight">
              Trend<em className="italic text-clay">Xee</em>
            </span>
          </Link>
          <p className="mt-5 max-w-sm font-display text-xl leading-snug text-ink/75">
            Fits before they go viral — and the small brands making them first.
          </p>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-ink/50">
            Zero middlemen, straight to the brand. TrendXee is a discovery platform and doesn't sell or fulfil the
            products shown.
          </p>
        </div>

        <nav aria-label="Lanes" className="lg:col-span-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45">Lanes</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {aesthetics.map((a) => (
              <li key={a.id}>
                <Link to="/aesthetic/$id" params={{ id: a.id }} className={linkClass}>
                  {laneLabel(a.name)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="TrendXee" className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45">TrendXee</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/about" className={linkClass}>
                About
              </Link>
            </li>
            <li>
              <Link to="/" hash="engine" className={linkClass}>
                The engine
              </Link>
            </li>
            <li>
              <Link to="/archive" className={linkClass}>
                Archive
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (user ? setContactOpen(true) : setAuthOpen(true))}
                className={linkClass}
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal" className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink/45">Legal</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/terms" className={linkClass}>
                Terms of use
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={linkClass}>
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12px] text-ink/45 sm:px-8">
          <p>© 2026 TrendXee · trendxee.com</p>
          <p className="hand text-[13px]">pinned by hand, read from real signals</p>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} user={user} />
    </footer>
  );
}
