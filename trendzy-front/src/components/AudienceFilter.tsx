import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { AUDIENCE_OPTIONS, normalizeAudienceFilter } from "@/lib/audience";

export function useAudience() {
  const search = useSearch({ strict: false });
  return normalizeAudienceFilter(search.audience);
}

/** The URL is the source of truth, including direct links, SSR and Back. */
export function AudienceFilter() {
  const audience = useAudience();
  const navigate = useNavigate();
  const pending = useRouterState({ select: (state) => state.status === "pending" });

  return (
    <div data-audience-filter className="inline-flex max-w-full flex-col items-start gap-2">
      <div role="group" aria-label="Shop by fit" aria-describedby="audience-help" aria-busy={pending} className="flex max-w-full items-center gap-1 rounded-full border border-border bg-paper/50 p-1">
        {AUDIENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={audience === option.value}
            disabled={pending}
            onClick={() => {
              if (option.value === audience) return;
              void navigate({
                to: ".",
                search: (previous) => ({ ...previous, audience: option.value === "ALL" ? undefined : option.value, trend: undefined }),
                resetScroll: false,
                viewTransition: false,
              });
            }}
            className={`inline-flex h-10 min-w-[4.25rem] items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-colors focus-visible:outline-offset-2 disabled:cursor-wait ${
              audience === option.value ? "bg-ink text-paper shadow-sm" : "text-ink/70 hover:bg-ink/[0.06] hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p id="audience-help" className="sr-only">
        Unisex fits appear in both Men &amp; Women.
      </p>
    </div>
  );
}
