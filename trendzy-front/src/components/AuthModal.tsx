import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ctaClass } from "@/components/Cta";
import { getGoogleLoginUrl } from "@/lib/api";

/** Sign-in. Google OAuth only (the backend sets the session cookie, then /auth/callback returns home). */
export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [redirecting, setRedirecting] = useState(false);

  const handleGoogleLogin = () => {
    setRedirecting(true);
    window.location.href = getGoogleLoginUrl();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-0 bg-raised shadow-lift p-0 text-ink">
        <div className="linen px-8 pb-8 pt-10">
          <p className="hand text-lg text-clay-ink">pin what you like</p>
          <DialogHeader className="mt-1 space-y-3 text-left">
            <DialogTitle className="font-display text-[2.4rem] font-normal leading-[1.02] tracking-tight">
              Keep a board <em className="italic text-clay">of your own.</em>
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-ink/70">
              Sign in to save drops to your archive. They stay there even after they leave the live feed.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-t border-border px-8 py-7">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={redirecting}
            className={`${ctaClass("outline", "lg")} w-full gap-3 bg-paper`}
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {redirecting ? "Opening Google…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-ink/70">
            By continuing you agree to the TrendXee Terms of Use and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
