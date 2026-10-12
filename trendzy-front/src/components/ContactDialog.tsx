import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ctaClass } from "@/components/Cta";
import { businessApiFetch } from "@/lib/api";
import type { CurrentUser } from "@/lib/user";

/** Contact form for all visitors. Replies go to their account or provided email. */
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
  const [guestEmail, setGuestEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();
    const email = (user?.email || guestEmail).trim();

    if (!email) {
      toast.error("Please provide your email address so we can reply.");
      return;
    }
    if (!message) {
      toast.error("Please enter a message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await businessApiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ email, message }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onOpenChange(false);
      setGuestEmail("");
      toast.success("Message sent. We'll reply to your email soon.");
    } catch {
      toast.error("We couldn't send that just now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[20px] border border-0 bg-raised shadow-lift p-7 text-ink">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-display text-3xl font-normal tracking-tight">
            Write to <em className="italic text-clay">us</em>
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/70">
            {user?.email ? (
              <>
                Sending as <strong className="font-semibold text-ink/80">{user.email}</strong>. We'll reply to this email.
              </>
            ) : (
              "Have a question, feedback, or a label to recommend? Drop us a line."
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
          {!user?.email && (
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="eyebrow text-ink/70">
                Your Email
              </Label>
              <Input
                required
                id="contact-email"
                name="email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@domain.com"
                className="rounded-xl border-ink/15 bg-cream/50 text-[15px] focus-visible:ring-clay"
              />
            </div>
          )}
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
