import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function ContactModal() {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    toast.success("Your message has been sent. We will get back to you soon!");
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
            Send us a message and we'll get back to you at hello@trendxee.com.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Your Email</Label>
            <Input required type="email" id="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input required type="text" id="subject" placeholder="What is this regarding?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea required id="message" rows={4} placeholder="Type your message here..." />
          </div>
          <Button type="submit" className="w-full mt-2">Send Message</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SiteFooter() {
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
          <ContactModal />
        </div>
      </div>
    </footer>
  );
}
