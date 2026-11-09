import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AUDIENCE_OPTIONS, type AudienceFilter } from "@/lib/audience";

type Props = {
  audience: AudienceFilter;
  laneName: string;
  pending: boolean;
  onApply: (audience: AudienceFilter) => void;
};

/** Change the fit without leaving the selected subcategory. */
export function LaneFilters({ audience, laneName, pending, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draftAudience, setDraftAudience] = useState(audience);
  const activeCount = Number(audience !== "ALL");

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (next) setDraftAudience(audience);
      setOpen(next);
    }}>
      <DialogTrigger asChild>
        <button data-lane-filters type="button" disabled={pending} aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink/20 bg-paper/50 px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink/45 hover:bg-ink/[0.05] disabled:cursor-wait">
          <SlidersHorizontal size={15} aria-hidden /> Filters
          {activeCount > 0 && <span aria-hidden className="grid size-5 place-items-center rounded-full bg-ink text-[10px] text-paper">{activeCount}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[24px] border-border bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-ink motion-reduce:animate-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[420px] sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:p-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-clay-ink">{laneName}</p>
        <DialogTitle className="font-display text-3xl font-normal tracking-tight">Filters</DialogTitle>
        <DialogDescription className="sr-only">Refine {laneName} by fit. Changes apply when you choose Show results.</DialogDescription>
        <fieldset className="mt-7 min-w-0">
          <legend className="mb-3 text-xs font-semibold text-ink/65">Shop for</legend>
          <div className="flex rounded-full bg-ink/[0.06] p-1">
            {AUDIENCE_OPTIONS.map((option) => (
              <button key={option.value} type="button" aria-pressed={draftAudience === option.value} onClick={() => setDraftAudience(option.value)}
                className={`h-11 min-w-0 flex-1 rounded-full px-3 text-sm font-semibold transition-colors ${draftAudience === option.value ? "bg-ink text-paper shadow-sm" : "text-ink/65 hover:text-ink"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-ink/55">Unisex pieces appear in both Men &amp; Women.</p>
        </fieldset>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-border pt-4">
          <button type="button" onClick={() => setDraftAudience("ALL")} className="h-11 px-1 text-sm font-semibold text-ink/65 underline underline-offset-4 hover:text-ink">Reset</button>
          <button type="button" onClick={() => { setOpen(false); onApply(draftAudience); }} className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85">Show results</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
