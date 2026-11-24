import { Instagram } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/seo";

export function InstagramLink({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`@${INSTAGRAM_HANDLE} on Instagram (opens in a new tab)`}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2.5 ${className}`}
    >
      <Instagram aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
      <span>@{INSTAGRAM_HANDLE}</span>
    </a>
  );
}
