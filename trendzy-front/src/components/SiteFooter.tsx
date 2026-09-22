import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { AuthModal } from "@/components/AuthModal";
import { businessApiFetch } from "@/lib/api";

function ContactModal({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const message = (e.target as HTMLFormElement).message.value;

    try {
      await businessApiFetch("/api/contact", { 
        method: "POST", 
        body: JSON.stringify({ email: user.email, message }) 
      });
      
      setOpen(false);
      toast.success("Your message has been sent. We will get back to you soon!");
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="transition-colors hover:text-clay cursor-pointer">
          Contact
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Sending as <strong>{user?.email || "your account"}</strong>. We'll reply to this email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea required id="message" rows={5} placeholder="Type your message here..." />
          </div>
          <Button disabled={isSubmitting} type="submit" className="w-full mt-2">
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiteFooter() {
  const { data: user } = useQuery({ queryKey: ['currentUser'] });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isAuthenticated = !!user;

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full flex-col items-start justify-between gap-3 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
        <p className="hand text-ink/70">
          © 2026 TrendXee · trendxee.com — zero middlemen, straight to the brand.
        </p>
        <div className="flex items-center gap-5 text-[13px] font-semibold">
          <Link to="/" hash="lanes" className="transition-colors hover:text-clay">
            Lanes
          </Link>
          <Link to="/about" className="transition-colors hover:text-clay">
            About
          </Link>
          <Link to="/archive" className="transition-colors hover:text-clay">
            Archive
          </Link>
          {isAuthenticated ? (
            <ContactModal user={user} />
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="transition-colors hover:text-clay cursor-pointer">
              Contact
            </button>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </footer>
  );
}
