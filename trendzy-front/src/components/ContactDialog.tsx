import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactForm } from "@/components/ContactForm";
import type { CurrentUser } from "@/lib/user";

export function ContactDialog({ open, onOpenChange, user }: {
  open: boolean; onOpenChange: (open: boolean) => void; user?: CurrentUser | null;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90svh] max-w-md overflow-y-auto rounded-[20px] border-0 bg-raised p-7 text-ink shadow-lift">
      <DialogHeader className="space-y-2 text-left">
        <DialogTitle className="font-display text-3xl font-normal tracking-tight">Write to <em className="text-clay">us</em></DialogTitle>
        <DialogDescription className="text-sm text-ink/70">A question, feedback, or a label to recommend? Drop us a line.</DialogDescription>
      </DialogHeader>
      <ContactForm email={user?.email} onSent={() => { onOpenChange(false); toast.success("Message sent. We'll reply to your email soon."); }} />
    </DialogContent>
  </Dialog>;
}
