import { audienceLabel } from "@/lib/audience";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, m } from "framer-motion";
import { toast } from "sonner";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { trendImage, trendLane } from "@/components/TrendCard";
import { ProductGallery } from "@/components/ProductGallery";
import { PairUpWith } from "@/components/PairUpWith";
import { useAudience } from "@/components/AudienceFilter";
import type { AudienceFilter } from "@/lib/audience";
import { trackOutfit, type PairingChoices, type PairingResult, type OutfitReceipt } from "@/lib/pairings";
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
import { ease, spring } from "@/motion/tokens";
import type { ProductMatch, Trend } from "@/lib/mock-data";
import { discountPercent, formatPrice, laneLabel } from "@/lib/format";
import { adminActions, trackProductClick, useSession } from "@/lib/useTrendActions";
import { TrustBadge } from "./TrustBadge";
import { rateTrendProduct, getBrandComments, addBrandComment, type BrandReview } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScoreDetails } from "@/components/ScoreDetails";

/**
 * The story behind a trend. The card's photo and title travel into this
 * view (shared layoutId), so it reads as the card opening rather than a
 * separate modal. Radix supplies focus trapping, Escape and aria-modal; the
 * content is portalled above page stacking contexts so sticky navigation never
 * covers the photos or close control. Shared layout stays in the React tree.
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
  // No Dialog.Trigger here (cards open the story through the URL), so keep
  // track of the opener ourselves and hand focus back to it on close.
  const openerRef = useRef<HTMLElement | null>(null);
  const storyScrollRef = useRef<HTMLDivElement | null>(null);


  return (
    <DialogPrimitive.Root open={!!trend} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {trend && (
          <DialogPrimitive.Portal forceMount>
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
                Array.from(document.querySelectorAll<HTMLElement>("[data-story-close]"))
                  .find((button) => button.getClientRects().length > 0)?.focus({ preventScroll: true });
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                const opener = openerRef.current;
                if (opener?.isConnected) opener.focus({ preventScroll: true });
              }}
            >
              <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6 lg:p-10">
                <m.div
                  className="pointer-events-auto relative h-[100dvh] w-full max-w-6xl sm:h-[min(88svh,860px)]"
                >
                  {/* The card's own paper, expanded: shared layout with the card surface. */}
                  <m.div
                    layoutId={`trend-surface-${trend.id}`}
                    transition={spring.layout}
                    className="fibre absolute inset-0 bg-raised shadow-lift"
                    style={{ borderRadius: 28 }}
                  />
                  <DialogPrimitive.Close
                    data-story-close
                    className="absolute right-3 top-[max(.75rem,env(safe-area-inset-top))] z-40 grid size-11 place-items-center rounded-full bg-paper/95 text-ink shadow-card lg:hidden"
                    aria-label="Close story"
                  >
                    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M5 5l10 10M15 5L5 15" /></svg>
                  </DialogPrimitive.Close>
                  <div ref={storyScrollRef} data-story-scroll className="relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain sm:rounded-[28px] lg:flex-row lg:overflow-hidden">
                  <StorySession
                    key={`${trend.id}-${trend.products.underdog?.shopUrl ?? ""}`}
                    source={trend}
                    scrollRef={storyScrollRef}
                    onClose={onClose}
                    onChanged={onChanged}
                    onDeleted={onDeleted}
                    archivedContext={archivedContext}
                    onUnarchived={onUnarchived}
                  />
                  </div>
                </m.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

/** Browse an outfit in one dialog, keeping its starting piece and choices intact. */
function StorySession({ source, scrollRef, onClose, onChanged, onDeleted, archivedContext, onUnarchived }: {
  source: Trend;
  scrollRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onChanged?: (trend: Trend) => void;
  onDeleted?: (id: string) => void;
  archivedContext: boolean;
  onUnarchived?: () => void;
}) {
  const globalAudience = useAudience();
  const [audience, setAudience] = useState<AudienceFilter>(globalAudience);
  const [choices, setChoices] = useState<PairingChoices>({});
  const [outfit, setOutfit] = useState<PairingResult | null>(null);
  const [receipt, setReceipt] = useState<OutfitReceipt | undefined>();
  const [pairing, setPairing] = useState<Trend | null>(null);
  const savedScroll = useRef({ outer: 0, copy: 0, rail: 0, identity: "" });
  const backRef = useRef(false);
  const current = pairing ?? source;

  useEffect(() => {
    if (!pairing || !receipt) return;
    const listener = (event: Event) => {
      const action = (event as CustomEvent<{ trendId: string; type: 'SAVE' | 'SHOP_CLICK' }>).detail;
      if (action?.trendId === pairing.id && ['SAVE', 'SHOP_CLICK'].includes(action.type)) trackOutfit(receipt, action.type, pairing.id);
    };
    window.addEventListener('trendxee:outfit-action', listener);
    return () => window.removeEventListener('trendxee:outfit-action', listener);
  }, [pairing?.id, receipt]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const outer = scrollRef.current;
      if (!outer) return;
      const copy = outer.querySelector<HTMLElement>('[data-story-copy-scroll]');
      if (backRef.current) {
        outer.scrollTop = savedScroll.current.outer;
        if (copy) copy.scrollTop = savedScroll.current.copy;
        const rail = outer.querySelector<HTMLElement>('[data-pairing-rail]');
        if (rail) rail.scrollLeft = savedScroll.current.rail;
        Array.from(outer.querySelectorAll<HTMLElement>('[data-pairing-identity]')).find((button) => button.dataset.pairingIdentity === savedScroll.current.identity)?.focus({ preventScroll: true });
        backRef.current = false;
      } else if (pairing) {
        outer.scrollTop = 0;
        if (copy) copy.scrollTop = 0;
        outer.querySelector<HTMLElement>('[data-story-title]')?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pairing?.id, scrollRef]);

  const back = () => { backRef.current = true; setPairing(null); };
  const openPairing = (next: Trend, identity: string, nextReceipt?: OutfitReceipt) => {
    const outer = scrollRef.current;
    savedScroll.current = { outer: outer?.scrollTop ?? 0, copy: outer?.querySelector('[data-story-copy-scroll]')?.scrollTop ?? 0, rail: outer?.querySelector('[data-pairing-rail]')?.scrollLeft ?? 0, identity };
    setPairing(next);
    setReceipt(nextReceipt);
  };

  return <>
    {pairing && scrollRef.current?.parentElement && createPortal(
      <button type="button" onClick={back} className="absolute left-3 top-[max(.75rem,env(safe-area-inset-top))] z-40 inline-flex min-h-11 max-w-[calc(100%-5rem)] items-center gap-2 rounded-full bg-paper/95 px-4 text-xs font-semibold text-ink shadow-card lg:hidden"><span aria-hidden>←</span> Back to outfit</button>,
      scrollRef.current.parentElement,
    )}
    <DetailBody
    key={`${current.id}-${current.products.underdog?.shopUrl ?? ""}`}
    trend={current}
    onClose={onClose}
    onChanged={(changed) => { if (pairing) setPairing(changed); onChanged?.(changed); }}
    onDeleted={(id) => { onDeleted?.(id); if (pairing) back(); }}
    archivedContext={pairing ? false : archivedContext}
    onUnarchived={pairing ? undefined : onUnarchived}
    backToSource={pairing ? back : undefined}
    sourceName={source.products.underdog?.title || source.name}
    pairingSection={!pairing ? <PairUpWith source={source} audience={audience} setAudience={setAudience} choices={choices} setChoices={setChoices} outfit={outfit} setOutfit={setOutfit} onOpen={openPairing} /> : undefined}
  /></>;
}

function DetailBody({
  trend,
  onClose,
  onChanged,
  onDeleted,
  archivedContext,
  onUnarchived,
  backToSource,
  sourceName,
  pairingSection,
}: {
  trend: Trend;
  onClose: () => void;
  onChanged?: (trend: Trend) => void;
  onDeleted?: (id: string) => void;
  archivedContext: boolean;
  onUnarchived?: () => void;
  backToSource?: () => void;
  sourceName?: string;
  pairingSection?: React.ReactNode;
}) {
  const { isAdmin } = useSession();
  const underdog = trend.products?.underdog;
  const images = [...new Set([trendImage(trend), ...(underdog?.imageUrls ?? [])].filter(Boolean))];
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
      <ProductGallery
        key={`${trend.id}-${underdog?.shopUrl ?? ""}`}
        category={trend.aestheticId}
        images={images}
        title={underdog?.title || trend.name}
        trendId={trend.id}
        score={score}
      />

      {/* Story */}
      <m.div
        className="relative flex shrink-0 flex-col lg:min-h-0 lg:flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.12 } }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
      >
        {backToSource && <div className="hidden border-b border-border px-6 py-3 lg:block lg:px-10">
          <button type="button" onClick={backToSource} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-clay-ink"><span aria-hidden>←</span> Back to outfit</button>
          <p className="truncate text-xs text-ink/60">Starting with {sourceName}</p>
        </div>}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
          <p className="flex min-w-0 flex-1 flex-col gap-1 eyebrow text-ink/70 sm:flex-row sm:items-center sm:gap-2">
            {lane && <span className="max-w-full truncate text-clay-ink">{laneLabel(lane.name)}</span>}
            {trend.subcategory && (
              <>
                <span className="hidden text-ink/25 sm:inline">/</span>
                <span className="max-w-full truncate">{trend.subcategory}</span>
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1">
          <WhatsAppShareButton trend={trend} laneId={lane?.id} />
          <ShareButton trend={trend} laneId={lane?.id} />
          <DialogPrimitive.Close
            data-story-close
            className="hidden size-10 shrink-0 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/[0.06] hover:text-ink lg:grid"
            aria-label="Close story"
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </DialogPrimitive.Close>
          </div>
        </div>

        <div data-story-copy-scroll className="px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:px-10 lg:pt-8">
          <DialogPrimitive.Title asChild>
            <m.h2
              data-story-title
              tabIndex={-1}
              layoutId={`trend-title-${trend.id}`}
              transition={spring.layout}
              className="font-display text-[clamp(2rem,3.4vw,3.1rem)] leading-[1.02] tracking-[-0.02em] [overflow-wrap:anywhere]"
            >
              {trend.name}
            </m.h2>
          </DialogPrimitive.Title>

          <m.div custom={0} variants={stagger} initial="hidden" animate="show" className="meta mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {audienceLabel(underdog?.audience) && <span className="rounded-full border border-border px-2.5 py-1">{audienceLabel(underdog?.audience)} fit</span>}
            {score > 0 && <ScoreDetails kind="hype" score={score} />}
            {score === 0 && <span className="text-ink/55" title="Usable Instagram analytics are not available for this brand yet.">Hype not measured</span>}
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

          {pairingSection}

          {/* Mainstream lookalikes */}
          {mainstream.length > 0 && (
            <m.div custom={5} variants={stagger} initial="hidden" animate="show" className="mt-8">
              <p className="eyebrow text-ink/70">Mainstream lookalikes</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

<ProductRating trend={trend} onChanged={onChanged} /><BrandHypeSection trend={trend} /><BrandReviewsSection brandName={trend.products?.underdog?.brandName || "Indie label"} aiSummary={trend.aiSummary} />{isAdmin && <AdminTools trend={trend} onChanged={onChanged} onDeleted={(id) => (onDeleted?.(id), onClose())} />}

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
            <DialogTitle className="font-display text-2xl font-normal">{editing === "score" ? "Brand hype score" : "Underdog price (₹)"}</DialogTitle>
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

/** 1-click WhatsApp share: pre-fills drop title, brand handle, and direct TrendXee link. */
function WhatsAppShareButton({ trend, laneId }: { trend: Trend; laneId?: string }) {
  const shareOnWhatsApp = () => {
    const url = laneId
      ? `${window.location.origin}/aesthetic/${laneId}?trend=${encodeURIComponent(trend.id)}`
      : window.location.href;
    const brand = trend.products?.underdog?.brandName ? ` by ${trend.products.underdog.brandName}` : "";
    const text = encodeURIComponent(`Check out "${trend.name}"${brand} on TrendXee:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={shareOnWhatsApp}
      aria-label="Share on WhatsApp"
      className="grid size-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
      title="Share on WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.101-.477-.15-.678.15-.2.301-.778.979-.953 1.18-.176.2-.351.226-.653.075-.301-.151-1.272-.469-2.424-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.151-.176.2-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.632-.929-2.235-.245-.588-.493-.508-.678-.518-.176-.008-.376-.01-.577-.01-.201 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.723.23 1.381.197 1.901.12.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.04 2C6.51 2 2.02 6.49 2.02 12.02c0 1.99.585 3.84 1.597 5.397L2 22l4.757-1.564A9.972 9.972 0 0012.04 22c5.53 0 10.02-4.49 10.02-10.02C22.06 6.49 17.57 2 12.04 2z" />
      </svg>
    </button>
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
    try {
      const updated = await rateTrendProduct(trend.id, val);
      setRating(val);
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
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate this brand ${star} out of 5`}
            onClick={() => submitRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={submitting || rating > 0}
            className={`grid size-11 shrink-0 place-items-center text-2xl transition-colors ${
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
      <h4 className="font-display text-xl mb-4 text-ink flex flex-wrap items-center gap-2">
        Instagram Hype 
        <span className="max-w-full break-all text-[13px] font-sans text-ink/50 bg-ink/5 px-2 py-0.5 rounded-full">@{trend.brandInstagramHandle}</span>
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-1 min-h-11 flex items-center">Followers</span>
          <span className="text-xl font-display text-ink">{followers ? followers.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex flex-col border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <div className="flex min-h-11 items-center gap-1 mb-1">
            <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider">Engagement</span>
            <ScoreDetails kind="engagement" />
          </div>
          <span className="text-xl font-display text-ink">{engagementRate != null ? engagementRate.toFixed(1) + '%' : 'N/A'}</span>
        </div>
        <div className="flex flex-col border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <span className="text-[11px] font-bold text-ink/60 uppercase tracking-wider mb-1 min-h-11 flex items-center">Posts/Wk</span>
          <span className="text-xl font-display text-ink">{postsPerWeek != null ? postsPerWeek.toFixed(1) : 'N/A'}</span>
        </div>
      </div>
      {trend.trendScoreUpdatedAt && (
        <p className="text-[10px] text-ink/40 mt-4 text-right">Updated: {new Date(trend.trendScoreUpdatedAt).toLocaleString()}</p>
      )}
    </div>
  );
}

function BrandReviewsSection({ brandName, aiSummary }: { brandName: string; aiSummary?: string }) {
  const aiReview = aiSummary?.trim();
  const { isSignedIn } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  
  const { data: comments = [], isLoading, isError } = useQuery({
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
      {aiReview && (
        <article aria-label="AI Review" className="mb-6 bg-raised p-4 rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h5 className="text-[13px] font-semibold text-ink">AI Review</h5>
            <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold text-clay-ink">AI-generated</span>
          </div>
          <p className="whitespace-pre-line text-pretty text-[14px] leading-relaxed text-ink/80">{aiReview}</p>
        </article>
      )}
      
      <form onSubmit={(e) => { e.preventDefault(); if (!isSignedIn) { toast.info("Please sign in to post a review."); return; } if (comment.trim()) mutation.mutate(comment); }} className="mb-6">
        <textarea
          aria-label="Your brand review"
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
        {isError && <p role="status" className="text-[13px] text-ink/60">Reviews couldn't load. Please try again in a moment.</p>}
        {!isLoading && !isError && comments.length === 0 && !aiReview && (
          <p className="text-[13px] text-ink/60 italic">No reviews for this brand yet.</p>
        )}
        {comments.map((c: BrandReview) => (
          <div key={c.id} className="bg-raised p-3 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-ink/70">User {c.userId?.substring(0, 4)}</span>
              {c.createdAt && <span className="text-[10px] text-ink/50">{new Date(c.createdAt).toLocaleDateString()}</span>}
            </div>
            <p className="break-words text-[13px] text-ink/80">{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}








