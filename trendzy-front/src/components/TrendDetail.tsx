import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, m, useDragControls, useReducedMotion, type DragControls, type PanInfo } from "framer-motion";
import { toast } from "sonner";
import { Stamp } from "@/components/Stamp";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { trendImage, trendLane } from "@/components/TrendCard";
import { Img } from "@/components/Img";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { ease, spring } from "@/motion/tokens";
import type { ProductMatch, Trend } from "@/lib/mock-data";
import { discountPercent, formatPrice, laneLabel } from "@/lib/format";
import { adminActions, trackProductClick, useSession } from "@/lib/useTrendActions";
import { TrustBadge } from "./TrustBadge";
import { rateTrendProduct, getBrandComments, addBrandComment, type BrandReview } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * The story behind a trend. The card's photo and title travel into this
 * view (shared layoutId), so it reads as the card opening rather than a
 * separate modal. Radix supplies focus trapping, Escape and aria-modal; the
 * content is rendered in place (no portal) so the shared layout can connect.
 */
export function TrendDetail({
  trend,
  onClose,
  onChanged,
  onDeleted,
  archivedContext = false,
  onUnarchived,
}: {
  trend: Trend | null;
  onClose: () => void;
  onChanged?: (trend: Trend) => void;
  onDeleted?: (id: string) => void;
  archivedContext?: boolean;
  onUnarchived?: () => void;
}) {
  const reduced = useReducedMotion();
  const dragControls = useDragControls();
  // No Dialog.Trigger here (cards open the story through the URL), so keep
  // track of the opener ourselves and hand focus back to it on close.
  const openerRef = useRef<HTMLElement | null>(null);


  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <DialogPrimitive.Root open={!!trend} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {trend && (
          <>
            <DialogPrimitive.Overlay forceMount asChild>
              <m.div
                className="fixed inset-0 z-50 bg-scrim/55 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              forceMount
              asChild
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                document.querySelector<HTMLElement>("[data-story-close]")?.focus({ preventScroll: true });
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                const opener = openerRef.current;
                if (opener?.isConnected) opener.focus({ preventScroll: true });
              }}
            >
              <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-6 lg:p-10">
                <m.div
                  className="pointer-events-auto relative h-[calc(100svh-1.5rem)] w-full max-w-6xl sm:h-[min(88svh,860px)]"
                  drag={reduced ? false : "y"}
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={onDragEnd}
                >
                  {/* The card's own paper, expanded: shared layout with the card surface. */}
                  <m.div
                    layoutId={`trend-surface-${trend.id}`}
                    transition={spring.layout}
                    className="fibre absolute inset-0 bg-raised shadow-lift"
                    style={{ borderRadius: 28 }}
                  />
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] lg:flex-row">
                  <DetailBody
                    trend={trend}
                    onClose={onClose}
                    onChanged={onChanged}
                    onDeleted={onDeleted}
                    archivedContext={archivedContext}
                    onUnarchived={onUnarchived}
                    dragControls={dragControls}
                  />
                  </div>
                </m.div>
              </div>
            </DialogPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

function DetailBody({
  trend,
  onClose,
  onChanged,
  onDeleted,
  archivedContext,
  onUnarchived,
  dragControls,
}: {
  trend: Trend;
  onClose: () => void;
  onChanged?: (trend: Trend) => void;
  onDeleted?: (id: string) => void;
  archivedContext: boolean;
  onUnarchived?: () => void;
  dragControls: DragControls;
}) {
  const { isAdmin } = useSession();
  const [showSummary, setShowSummary] = useState(false);
  const underdog = trend.products?.underdog;
  const image = trendImage(trend);
  const lane = trendLane(trend);
  const price = formatPrice(underdog?.price, underdog?.currency);
  const off = discountPercent(underdog?.price, underdog?.originalPrice);
  const score = Math.round(trend.trendScore || 0);
  const mainstream = (
    [
      { source: "amazon" as const, label: "Amazon", product: trend.products?.amazon },
      { source: "flipkart" as const, label: "Flipkart", product: trend.products?.flipkart },
    ] as const
  ).filter((p): p is typeof p & { product: ProductMatch } => !!p.product?.shopUrl);

  const stagger = {
    hidden: { opacity: 0, y: 14 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.05, duration: 0.45, ease: ease.drift } }),
  };

  return (
    <>
      {/* Mobile grab handle: drag down to close */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex h-9 touch-none items-center justify-center sm:hidden"
        onPointerDown={(e) => dragControls.start(e)}
        aria-hidden
      >
        <span className="h-1 w-10 rounded-full bg-on-scrim/90 shadow-[0_0_0_1px_color-mix(in_oklab,var(--scrim)_30%,transparent),0_1px_4px_color-mix(in_oklab,var(--scrim)_45%,transparent)]" />
      </div>

      {/* Media */}
      <PointerScope className="relative h-[42%] shrink-0 lg:h-full lg:w-[48%]">
        <m.div
          layoutId={`trend-media-${trend.id}`}
          className="absolute inset-0 overflow-hidden bg-cream"
          style={{ borderRadius: 0 }}
          transition={spring.layout}
        >
          <Parallax depth={4} bleed className="absolute inset-0">
            <Img src={image} alt={underdog?.title || trend.name} eager fallbackLabel={lane ? laneLabel(lane.name) : undefined} className="h-full w-full object-cover" />
          </Parallax>
        </m.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-scrim/50 to-transparent lg:hidden" />
        {score > 0 && (
          <m.div
            className="absolute bottom-5 left-5 z-10 lg:bottom-8 lg:left-8"
            initial={{ scale: 1.5, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            transition={{ ...spring.settle, delay: 0.3 }}
          >
            <Stamp score={score} size="lg" pressable className="shadow-print" />
          </m.div>
        )}
      </PointerScope>

      {/* Story */}
      <m.div
        className="relative flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.12 } }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 lg:px-10">
          <p className="flex min-w-0 items-center gap-2 eyebrow text-ink/70">
            {lane && <span className="text-clay-ink">{laneLabel(lane.name)}</span>}
            {trend.subcategory && (
              <>
                <span className="text-ink/25">/</span>
                <span className="truncate">{trend.subcategory}</span>
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1">
          <ShareButton trend={trend} laneId={lane?.id} />
          <DialogPrimitive.Close
            data-story-close
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="Close story"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </DialogPrimitive.Close>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-10 pt-6 lg:px-10 lg:pt-8">
          <DialogPrimitive.Title asChild>
            <m.h2
              layoutId={`trend-title-${trend.id}`}
              transition={spring.layout}
              className="font-display text-[clamp(2rem,3.4vw,3.1rem)] leading-[1.02] tracking-[-0.02em]"
            >
              {trend.name}
            </m.h2>
          </DialogPrimitive.Title>

          <m.div custom={0} variants={stagger} initial="hidden" animate="show" className="meta mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {score > 0 && <span>Trend score {score}</span>}
            {trend.indiaRelevant && <span>Relevant in India</span>}
          </m.div>

          {trend.vibeTags.length > 0 && (
            <m.ul custom={1} variants={stagger} initial="hidden" animate="show" className="mt-4 flex flex-wrap gap-1.5">
              {trend.vibeTags.map((tag) => (
                <li key={tag} className="rounded-full bg-cream px-3 py-1 text-[13px] font-semibold text-ink/70">
                  #{tag}
                </li>
              ))}
            </m.ul>
          )}
          {trend.aiSummary && (
            <m.div custom={2} variants={stagger} initial="hidden" animate="show" className="mt-7 max-w-[60ch]">
              <button
                type="button"
                onClick={() => setShowSummary(!showSummary)}
                className="flex items-center gap-2 text-[14px] font-semibold text-ink/70 hover:text-ink transition-colors focus-visible:outline-none"
              >
                <span>AI Summary</span>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-4 transition-transform duration-200 ${showSummary ? "rotate-180" : ""}`} aria-hidden>
                  <path d="M5 7.5L10 12.5L15 7.5" />
                </svg>
              </button>
              <AnimatePresence>
                {showSummary && (
                  <m.p
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: "1rem" }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden text-pretty font-display text-[1.22rem] leading-[1.65] text-ink/85"
                  >
                    {trend.aiSummary}
                  </m.p>
                )}
              </AnimatePresence>
            </m.div>
          )}

          {trend.whyTrending.length > 0 && (
            <m.div custom={3} variants={stagger} initial="hidden" animate="show" className="mt-8">
              <p className="eyebrow text-ink/70">Why it's climbing</p>
              <ul className="mt-3 space-y-2.5">
                {trend.whyTrending.map((reason) => (
                  <li key={reason} className="flex gap-3 text-[15px] leading-relaxed text-ink/75">
                    <span className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-clay" />
                    {reason}
                  </li>
                ))}
              </ul>
            </m.div>
          )}

          {/* The underdog */}
          {underdog?.shopUrl && (
            <m.div custom={4} variants={stagger} initial="hidden" animate="show" className="mt-9 rounded-[20px] bg-cream/70 p-5 ring-1 ring-clay/25">
              <p className="eyebrow text-[11px] text-clay-ink">The underdog</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-2xl italic flex flex-wrap items-center gap-2"><span className="truncate">{underdog.brandName || "Indie label"}</span><TrustBadge rating={trend.underdogRating} signals={trend.ratingSignals} /></p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] text-ink/70">{underdog.title}</p>
                </div>
                {price && (
                  <div className="text-right">
                    {off && <p className="text-[13px] text-ink/70 line-through">{formatPrice(underdog.originalPrice, underdog.currency)}</p>}
                    <p className="font-display text-2xl tabular-nums">{price}</p>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Cta magnetic>
                  <a
                    href={underdog.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackProductClick(trend.id, "underdog", underdog.shopUrl)}
                    className={ctaClass("primary")}
                  >
                    Shop the underdog <CtaArrow className="-rotate-45" />
                  </a>
                </Cta>
                <BookmarkButton trendId={trend.id} trendName={trend.name} knownArchived={archivedContext} onUnarchived={onUnarchived} variant="full" />
              </div>
            </m.div>
          )}

          {/* Mainstream lookalikes */}
          {mainstream.length > 0 && (
            <m.div custom={5} variants={stagger} initial="hidden" animate="show" className="mt-8">
              <p className="eyebrow text-ink/70">Mainstream lookalikes</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {mainstream.map(({ source, label, product }) => (
                  <a
                    key={source}
                    href={product.shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackProductClick(trend.id, source, product.shopUrl)}
                    data-cursor="view"
                    data-cursor-label="Compare"
                    className="group flex gap-3 rounded-xl p-2 ring-1 ring-border transition-colors hover:bg-cream/60"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-sand/40">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt="" loading="lazy" className="media-zoom h-full w-full object-cover group-hover:scale-[1.04]" />
                      )}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="eyebrow text-[11px] text-ink/70">{label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink/80">{product.title || product.brandName}</p>
                      {formatPrice(product.price, product.currency) && (
                        <p className="mt-0.5 text-[13px] tabular-nums text-ink/70">{formatPrice(product.price, product.currency)}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </m.div>
          )}

<ProductRating trend={trend} onChanged={onChanged} /><BrandHypeSection trend={trend} /><BrandReviewsSection brandName={trend.products?.underdog?.brandName || "Indie label"} />{isAdmin && <AdminTools trend={trend} onChanged={onChanged} onDeleted={(id) => (onDeleted?.(id), onClose())} />}

          <p className="mt-10 border-t border-border pt-5 text-[12px] leading-relaxed text-ink/70">
            TrendXee is a discovery platform. Product links open the brand's or marketplace's own store; TrendXee doesn't
            sell or fulfil these products.
          </p>
        </div>
      </m.div>
    </>
  );
}

function AdminTools({ trend, onChanged, onDeleted }: { trend: Trend; onChanged?: (t: Trend) => void; onDeleted?: (id: string) => void }) {
  const [editing, setEditing] = useState<"score" | "price" | null>(null);
  const [value, setValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = (field: "score" | "price") => {
    setValue(String(field === "score" ? Math.round(trend.trendScore) : trend.products?.underdog?.price ?? trend.estimatedPrice ?? ""));
    setEditing(field);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || (editing === "score" && n > 100)) {
      toast.error(editing === "score" ? "Enter a score from 0 to 100." : "Enter a valid price.");
      return;
    }
    setBusy(true);
    try {
      if (editing === "score") {
        onChanged?.(await adminActions.score(trend.id, n));
      } else {
        await adminActions.price(trend.id, n);
        onChanged?.({
          ...trend,
          estimatedPrice: n,
          products: { ...trend.products, underdog: trend.products?.underdog ? { ...trend.products.underdog, price: n } : undefined },
        });
      }
      toast.success("Saved");
      setEditing(null);
    } catch {
      toast.error("That didn't save.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await adminActions.remove(trend.id);
      toast("Trend deleted");
      onDeleted?.(trend.id);
    } catch {
      toast.error("Couldn't delete that trend.");
    }
  };

  return (
    <div className="mt-8 rounded-[20px] border border-dashed border-destructive/30 p-4">
      <p className="eyebrow text-[11px] text-destructive">Admin</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => open("score")} className={ctaClass("outline", "sm")}>
          Edit score
        </button>
        <button type="button" onClick={() => open("price")} className={ctaClass("outline", "sm")}>
          Edit price
        </button>
        <button type="button" onClick={() => setConfirmDelete(true)} className={`${ctaClass("outline", "sm")} text-destructive`}>
          Delete trend
        </button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm rounded-[20px] border-0 bg-raised shadow-lift p-7">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">{editing === "score" ? "Trend score" : "Underdog price (₹)"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="mt-2 flex flex-col gap-4">
            <input
              autoFocus
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 rounded-xl border border-ink/15 bg-cream/50 px-4 font-display text-2xl tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-clay"
            />
            <button type="submit" disabled={busy} className={ctaClass("primary")}>
              {busy ? "Saving…" : "Save"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="max-w-md rounded-[20px] border-0 bg-raised shadow-lift p-7">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-display text-2xl font-normal">Delete this trend permanently?</AlertDialogTitle>
            <AlertDialogDescription>“{trend.name}” will be removed from the board for everyone. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className={ctaClass("outline")}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={`${ctaClass("primary")} bg-destructive hover:bg-destructive/90`} onClick={remove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Share the story: native share sheet where available, otherwise copy the link. */
function ShareButton({ trend, laneId }: { trend: Trend; laneId?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = laneId
      ? `${window.location.origin}/aesthetic/${laneId}?trend=${encodeURIComponent(trend.id)}`
      : window.location.href;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (nav.share && window.matchMedia("(pointer: coarse)").matches) {
        await nav.share({ title: trend.name, text: `${trend.name} — on TrendXee`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* share sheet dismissed — nothing to do */
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : "Share this story"}
      className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.svg key="ok" viewBox="0 0 20 20" className="size-4 text-success" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={spring.tactile} aria-hidden>
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </m.svg>
        ) : (
          <m.svg key="share" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={spring.tactile} aria-hidden>
            <path d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5M5 10H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-1" />
          </m.svg>
        )}
      </AnimatePresence>
    </button>
  );
}

function ProductRating({ trend, onChanged }: { trend: Trend; onChanged?: (t: Trend) => void }) {
  const { isSignedIn } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async (val: number) => {
    if (!isSignedIn) {
      toast.info("Please sign in to rate this brand.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setRating(val);
    try {
      const updated = await rateTrendProduct(trend.id, val);
      toast.success("Thanks for rating!");
      onChanged?.(updated);
    } catch {
      toast.error("Couldn't submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="text-[13px] font-semibold text-ink/80 mb-2">Rate this brand:</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => submitRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={submitting || rating > 0}
            className={`text-2xl transition-colors ${
              (hoverRating || rating) >= star ? "text-amber-500" : "text-ink/20 hover:text-amber-300"
            }`}
          >
            ★
          </button>
        ))}
        {trend.userRatingCount ? (
          <span className="text-[12px] text-ink/60 ml-2">({trend.userRatingCount} user {trend.userRatingCount === 1 ? 'rating' : 'ratings'})</span>
        ) : null}
      </div>
    </div>
  );
}


function BrandHypeSection({ trend }: { trend: Trend }) {
  if (!trend.brandInstagramHandle || !trend.brandHypeSignals) return null;
  const { followers, engagementRate, postsPerWeek } = trend.brandHypeSignals;
  
  return (
    <div className="mt-8 bg-cream/50 rounded-2xl p-5 border border-border">
      <h4 className="font-display text-xl mb-4 text-ink flex items-center gap-2">
        Instagram Hype 
        <span className="text-[13px] font-sans text-ink/50 bg-ink/5 px-2 py-0.5 rounded-full">@{trend.brandInstagramHandle}</span>
      </h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-1">Followers</span>
          <span className="text-xl font-display text-ink">{followers ? followers.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex flex-col border-l border-border pl-4">
          <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-1">Engagement</span>
          <span className="text-xl font-display text-ink">{engagementRate ? (engagementRate * 100).toFixed(1) + '%' : 'N/A'}</span>
        </div>
        <div className="flex flex-col border-l border-border pl-4">
          <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-1">Posts/Wk</span>
          <span className="text-xl font-display text-ink">{postsPerWeek ? postsPerWeek.toFixed(1) : 'N/A'}</span>
        </div>
      </div>
      {trend.trendScoreUpdatedAt && (
        <p className="text-[10px] text-ink/40 mt-4 text-right">Updated: {new Date(trend.trendScoreUpdatedAt).toLocaleString()}</p>
      )}
    </div>
  );
}

function BrandReviewsSection({ brandName }: { brandName: string }) {
  const { isSignedIn } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["brandComments", brandName],
    queryFn: () => getBrandComments(brandName),
    enabled: !!brandName,
  });

  const mutation = useMutation({
    mutationFn: (text: string) => addBrandComment(brandName, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandComments", brandName] });
      setComment("");
      toast.success("Review posted!");
    },
    onError: () => toast.error("Couldn't post review."),
  });

  return (
    <div className="mt-8 bg-cream/50 rounded-2xl p-5 border border-border">
      <h4 className="font-display text-xl mb-4 text-ink">Brand Reviews</h4>
      
      <form onSubmit={(e) => { e.preventDefault(); if (!isSignedIn) { toast.info("Please sign in to post a review."); return; } if (comment.trim()) mutation.mutate(comment); }} className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isSignedIn ? "Leave a review about shipping, fabric, service..." : "Sign in to leave a review..."}
          className="w-full bg-raised border border-border rounded-xl p-3 text-[14px] text-ink focus:outline-none focus:border-clay min-h-[80px]"
          disabled={mutation.isPending || !isSignedIn}
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" disabled={!comment.trim() || mutation.isPending || !isSignedIn} className={ctaClass("primary", "sm")}>
            {mutation.isPending ? "Posting..." : "Post Review"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
        {isLoading && <p className="text-[13px] text-ink/60">Loading reviews...</p>}
        {!isLoading && comments.length === 0 && (
          <p className="text-[13px] text-ink/60 italic">No reviews for this brand yet.</p>
        )}
        {comments.map((c: BrandReview) => (
          <div key={c.id} className="bg-raised p-3 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-ink/70">User {c.userId?.substring(0, 4)}</span>
              {c.createdAt && <span className="text-[10px] text-ink/50">{new Date(c.createdAt).toLocaleDateString()}</span>}
            </div>
            <p className="text-[13px] text-ink/80">{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}








