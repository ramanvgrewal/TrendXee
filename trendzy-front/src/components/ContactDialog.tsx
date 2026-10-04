import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ctaClass } from "@/components/Cta";
import { businessApiFetch } from "@/lib/api";
import type { CurrentUser } from "@/lib/user";

/** Contact form for signed-in users. Replies go to their account email. */
export function ContactDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: CurrentUser | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = (e.currentTarget.elements.namedItem("message") as HTMLTextAreaElement).value;
    setIsSubmitting(true);
    try {
      const res = await businessApiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ email: user?.email, message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onOpenChange(false);
      toast.success("Message sent. We'll reply to your email soon.");
    } catch {
      toast.error("We couldn't send that just now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-0 bg-raised shadow-lift p-7 text-ink">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-3xl font-normal tracking-tight">
            Write to <em className="italic text-clay">us</em>
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/70">
            Sending as <strong className="font-semibold text-ink/80">{user?.email || "your account"}</strong>. We'll
            reply to this email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="message" className="eyebrow text-ink/70">
              Message
            </Label>
            <Textarea
              required
              id="message"
              name="message"
              rows={5}
              placeholder="A brand we should know about, a bug, a hello…"
              className="rounded-xl border-ink/15 bg-cream/50 text-[15px] focus-visible:ring-clay"
            />
          </div>
          <button disabled={isSubmitting} type="submit" className={`${ctaClass("primary")} w-full`}>
            {isSubmitting ? "Sending…" : "Send message"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
