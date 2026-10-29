import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ctaClass } from "@/components/Cta";
import { businessApiFetch } from "@/lib/api";

export function ContactForm({ email, onSent }: { email?: string; onSent?: () => void }) {
  const formId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = { email: (email || String(values.get("email") || "")).trim(), message: String(values.get("message") || "").trim(), companyWebsite: String(values.get("companyWebsite") || "") };
    if (payload.message.length < 10) { setError("Please write at least 10 characters so we can understand your message."); return; }
    setPending(true); setError(""); setSent(false);
    try {
      const response = await businessApiFetch("/api/contact", { method: "POST", body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
      if (response.status === 429) { setError("Please wait 15 minutes before sending another message."); return; }
      if (!response.ok) throw new Error("Contact service unavailable");
      form.reset(); setSent(true); onSent?.();
    } catch { setError("We couldn't confirm your message was sent. Please try again later, or email hello@trendxee.com."); }
    finally { setPending(false); }
  };
  return <form method="post" onSubmit={submit} className="mt-6 flex flex-col gap-5" aria-label="Contact TrendXee">
    {email ? <p className="text-sm text-ink/70">Replying to <strong>{email}</strong>.</p> : <div className="space-y-2">
      <Label htmlFor={`${formId}-email`}>Your email</Label>
      <Input required id={`${formId}-email`} name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@domain.com" className="min-h-11 rounded-xl bg-cream/50" />
    </div>}
    <div className="hidden" aria-hidden><label>Leave this blank<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="space-y-2">
      <Label htmlFor={`${formId}-message`}>Message</Label>
      <Textarea required id={`${formId}-message`} name="message" rows={6} minLength={10} maxLength={5000} aria-describedby={`${formId}-help`} placeholder="A label to recommend, a question, a bug, a hello…" className="rounded-xl bg-cream/50" />
      <p id={`${formId}-help`} className="text-xs text-ink/60">10–5,000 characters. Please don't include passwords or payment details.</p>
    </div>
    <p className="text-xs leading-relaxed text-ink/65">We'll use your email to reply. Read our <Link to="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>
    <noscript><p className="text-sm">Please email hello@trendxee.com if JavaScript is disabled.</p></noscript>
    {error && <p role="alert" className="text-sm text-clay-ink">{error}</p>}
    {sent && <p role="status" className="text-sm text-ink/80">Message sent. We'll reply to the email you provided.</p>}
    <button type="submit" disabled={pending} aria-busy={pending} className={`${ctaClass("primary")} w-full disabled:opacity-60`}>{pending ? "Sending…" : "Send message"}</button>
  </form>;
}
