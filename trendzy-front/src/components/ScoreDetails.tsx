import * as Dialog from "@radix-ui/react-dialog";
import { Eye, X } from "lucide-react";

/** Tap, click and keyboard all open the same readable explanation, above the product story. */
export function ScoreDetails({ kind, score }: { kind: "hype" | "engagement"; score?: number }) {
  const hype = kind === "hype";
  const label = hype ? "How Brand Hype is calculated" : "How Instagram engagement score is calculated";
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" aria-label={label}
          className={hype
            ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-cream/70 px-3 text-ink/80 transition-colors hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            : "grid size-11 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-cream hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"}>
          {hype && <span>Brand hype {score}</span>}<Eye className="size-4" aria-hidden />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-scrim/55 backdrop-blur-[3px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[111] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-paper p-6 text-ink shadow-lift max-h-[calc(100dvh-2rem)]">
          <Dialog.Title className="pr-8 font-display text-2xl font-normal leading-tight">{hype ? "Brand hype" : "Instagram engagement"}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-ink/70">
            {hype ? "A score from 0–100 based on the brand’s measured Instagram activity." : "Average interactions per recent post, expressed as a percentage of the brand’s followers."}
          </Dialog.Description>
          {hype ? <>
            <dl className="mt-5 space-y-3 text-sm">
              {[["Audited baseline", "60 points"], ["Reach", "Up to 25"], ["Engagement", "Up to 8"], ["Posting cadence", "Up to 7"]].map(([name, points]) => (
                <div key={name} className="flex justify-between gap-4"><dt className="text-ink/70">{name}</dt><dd className="font-semibold">{points}</dd></div>
              ))}
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-ink/60">Inactivity can subtract up to 20 points. Without usable Instagram analytics, hype is unmeasured and the score is 0.</p>
          </> : <>
            <p className="mt-5 rounded-xl bg-cream p-4 font-mono text-xs leading-relaxed">(Average likes + average comments) ÷ followers × 100</p>
            <p className="mt-4 text-xs leading-relaxed text-ink/60">Based on the recent posts available during the audit. Engagement alone does not verify follower authenticity or product quality.</p>
          </>}
          <Dialog.Close aria-label="Close score details" className="absolute right-2 top-2 grid size-11 place-items-center rounded-full text-ink/60 transition-colors hover:bg-cream hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"><X className="size-4" aria-hidden /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
