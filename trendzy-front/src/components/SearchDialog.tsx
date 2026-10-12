import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, Tag, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { aesthetics } from "@/lib/mock-data";
import { laneLabel } from "@/lib/format";

const POPULAR_TAGS = [
  { label: "Cargo Pants", lane: "bottoms", subcategory: "cargo" },
  { label: "Oversized Tees", lane: "tees", subcategory: "oversized" },
  { label: "Varsity Jackets", lane: "outerwear", subcategory: "varsity" },
  { label: "Denim & Jeggings", lane: "bottoms", subcategory: "denim" },
  { label: "Anime Hoodies", lane: "anime", subcategory: "hoodies" },
  { label: "Chunky Sneakers", lane: "sneakers", subcategory: "sneakers" },
  { label: "Trucker Caps", lane: "caps", subcategory: "caps" },
  { label: "Vintage Polos", lane: "polos", subcategory: "polos" },
];

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Reset query on open/close
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const cleanQuery = query.trim().toLowerCase();

  const matchingLanes = useMemo(() => {
    if (!cleanQuery) return aesthetics;
    return aesthetics.filter(
      (a) =>
        a.name.toLowerCase().includes(cleanQuery) ||
        a.description?.toLowerCase().includes(cleanQuery) ||
        a.vibeTags?.some((tag) => tag.toLowerCase().includes(cleanQuery)),
    );
  }, [cleanQuery]);

  const matchingTags = useMemo(() => {
    if (!cleanQuery) return POPULAR_TAGS;
    return POPULAR_TAGS.filter(
      (t) =>
        t.label.toLowerCase().includes(cleanQuery) ||
        t.lane.toLowerCase().includes(cleanQuery) ||
        t.subcategory.toLowerCase().includes(cleanQuery),
    );
  }, [cleanQuery]);

  const handleSelectLane = (laneId: string) => {
    onOpenChange(false);
    navigate({ to: "/aesthetic/$id", params: { id: laneId } });
  };

  const handleSelectTag = (laneId: string, subcategory: string) => {
    onOpenChange(false);
    navigate({
      to: "/aesthetic/$id",
      params: { id: laneId },
      search: { subcategory } as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-[24px] border border-border bg-raised p-0 text-ink shadow-lift">
        <DialogTitle className="sr-only">Search TrendXee</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-5 shrink-0 text-ink/50" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search aesthetics, fits, tags (e.g. Streetwear, Cargo, Anime)..."
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/50 sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-4 no-scrollbar">
          {/* Aesthetic Lanes */}
          <div className="mb-4">
            <p className="eyebrow px-3 text-[10px] text-ink/50 uppercase tracking-widest mb-2">
              Lanes & Aesthetics
            </p>
            <div className="flex flex-col gap-1">
              {matchingLanes.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => handleSelectLane(lane.id)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-ink/[0.05] hover:text-ink"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="size-4 text-clay" />
                    <span className="font-medium">{laneLabel(lane.name)}</span>
                    <span className="text-[12px] text-ink/50">· {lane.signalCount || 5}+ drops</span>
                  </span>
                  <ArrowRight className="size-4 text-ink/40" />
                </button>
              ))}
            </div>
          </div>

          {/* Style Tags & Subcategories */}
          {matchingTags.length > 0 && (
            <div>
              <p className="eyebrow px-3 text-[10px] text-ink/50 uppercase tracking-widest mb-2">
                Trending Fits & Keywords
              </p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {matchingTags.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleSelectTag(tag.lane, tag.subcategory)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-paper px-3 py-1.5 text-xs text-ink/80 transition-colors hover:border-clay hover:text-clay"
                  >
                    <Tag className="size-3 text-ink/40" />
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingLanes.length === 0 && matchingTags.length === 0 && (
            <div className="py-8 text-center text-sm text-ink/60">
              No matching drops or aesthetics found for "{query}".
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
