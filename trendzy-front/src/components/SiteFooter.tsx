import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function SiteFooter() {
  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("hello@trendxee.com");
    toast.success("Email address copied to clipboard!");
  };

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
          <button onClick={handleCopyEmail} className="transition-colors hover:text-clay cursor-pointer">
            Contact
          </button>
        </div>
      </div>
    </footer>
  );
}
