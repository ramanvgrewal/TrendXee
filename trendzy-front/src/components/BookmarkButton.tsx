import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuthModal } from "@/components/AuthModal";
import { ctaClass } from "@/components/Cta";
import { Magnetic } from "@/motion/Magnetic";
import { spring } from "@/motion/tokens";
import { useArchiveStatus, useSession, useToggleArchive } from "@/lib/useTrendActions";

/**
 * Pin / unpin a trend to the user's archive. Signed out → opens sign-in
 * instead of failing. Unpinning asks first, because a trend that has left the
 * live feed is gone for good once it leaves the archive.
 */
export function BookmarkButton({
  trendId,
  trendName,
  knownArchived = false,
  onUnarchived,
  variant = "chip",
}: {
  trendId: string;
  trendName: string;
  knownArchived?: boolean;
  onUnarchived?: () => void;
  variant?: "chip" | "full";
}) {
  const { isSignedIn } = useSession();
  const statusArchived = useArchiveStatus(trendId, knownArchived);
  const [localArchived, setLocalArchived] = useState<boolean | null>(null);
  const archived = localArchived ?? statusArchived;
  const toggle = useToggleArchive(trendId, onUnarchived);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = () =>
    toggle.mutate(archived, {
      onSuccess: (now) => setLocalArchived(now),
    });

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn) return setAuthOpen(true);
    if (archived) return setConfirmOpen(true);
    run();
  };

  const icon = (
    <m.svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={archived ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      animate={archived ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      aria-hidden
    >
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1Z" />
    </m.svg>
  );

  return (
    <>
      {variant === "chip" ? (
        <Magnetic max={4}>
          <m.button
            type="button"
            onClick={onClick}
            disabled={toggle.isPending}
            whileTap={{ scale: 0.88 }}
            transition={spring.tactile}
            aria-pressed={archived}
            data-cursor="button"
            aria-label={archived ? `Remove ${trendName} from your archive` : `Save ${trendName} to your archive`}
            className={`grid size-9 place-items-center rounded-full backdrop-blur-sm transition-colors ${
              archived ? "bg-clay text-paper" : "bg-paper/85 text-ink/70 hover:bg-paper hover:text-clay"
            }`}
          >
            {icon}
          </m.button>
        </Magnetic>
      ) : (
        <m.button
          type="button"
          onClick={onClick}
          disabled={toggle.isPending}
          whileTap={{ scale: 0.97 }}
          transition={spring.tactile}
          aria-pressed={archived}
          data-cursor="button"
          className={`${ctaClass(archived ? "accent" : "outline")} gap-2`}
        >
          {icon}
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={archived ? "saved" : "save"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {archived ? "In your archive" : "Save to archive"}
            </m.span>
          </AnimatePresence>
        </m.button>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl border-border bg-paper p-7" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-display text-2xl font-normal tracking-tight">Remove from your archive?</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] leading-relaxed text-ink/65">
              If “{trendName}” has already left the live feed, you won't be able to find it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel className={ctaClass("outline")}>Keep it</AlertDialogCancel>
            <AlertDialogAction className={ctaClass("primary")} onClick={run}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
