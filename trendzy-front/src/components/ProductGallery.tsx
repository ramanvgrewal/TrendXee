import { useEffect, useRef, useState, type PointerEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { m } from "framer-motion";
import { ArrowLeft, ArrowRight, Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { isShoeCategory, productImageFit } from "@/lib/format";
import { Img } from "@/components/Img";
import { Stamp } from "@/components/Stamp";
import { Parallax, PointerScope } from "@/motion/Parallax";
import { spring } from "@/motion/tokens";
import { usePrefersReducedMotion } from "@/motion/hooks";

function GalleryPhoto({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete) setStatus(image.naturalWidth ? "ready" : "error");
  }, []);
  return (
    <div className="relative h-full w-full">
      {(!src || status === "error") ? (
        <div role="img" aria-label={`${alt} — unavailable`} className="grid h-full place-items-center px-5 text-center text-sm opacity-70">Photo unavailable. Try another view.</div>
      ) : <>
        {status === "loading" && <div role="status" className="absolute inset-0 grid place-items-center text-sm opacity-70">Loading photo…</div>}
        <img ref={imageRef} src={src} alt={alt} draggable={false} decoding="async"
          onLoad={() => setStatus("ready")} onError={() => setStatus("error")}
          className={`h-full w-full transition-opacity duration-150 ${status === "ready" ? "opacity-100" : "opacity-0"} ${className}`} />
      </>}
    </div>
  );
}

/** Large, uncropped mobile photos; the desktop portrait keeps its existing layout. */
export function ProductGallery({ images, title, trendId, score, category }: {
  category?: string;
  images: string[];
  title: string;
  trendId: string;
  score: number;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const active = Math.min(index, Math.max(0, images.length - 1));
  const image = images[active];
  const reduced = usePrefersReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const select = (next: number) => {
    setIndex(images.length ? (next + images.length) % images.length : 0);
    setZoomed(false);
  };

  useEffect(() => {
    if (images.length < 2) return;
    // Warm only the neighbouring views, so swiping does not wait for a cold
    // full-size download and large galleries do not all load at once.
    for (const next of [(active + 1) % images.length, (active - 1 + images.length) % images.length]) {
      new Image().src = images[next];
    }
  }, [active, images]);

  useEffect(() => {
    const rail = railRef.current;
    const thumb = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (rail && thumb) rail.scrollTo({ left: thumb.offsetLeft - (rail.clientWidth - thumb.clientWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: zoomed ? (viewport.scrollWidth - viewport.clientWidth) / 2 : 0, top: zoomed ? (viewport.scrollHeight - viewport.clientHeight) / 2 : 0 });
  }, [zoomed, active, open]);

  const startSwipe = (event: PointerEvent<HTMLElement>) => {
    swipedRef.current = false;
    startRef.current = event.isPrimary && event.pointerType !== "mouse" ? { x: event.clientX, y: event.clientY } : null;
  };
  const finishSwipe = (event: PointerEvent<HTMLElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || images.length < 2) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.3) {
      swipedRef.current = true;
      select(active + (x < 0 ? 1 : -1));
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setZoomed(false); }}>
      <PointerScope className="relative shrink-0 bg-cream lg:h-full lg:w-[48%]">
        <div className="relative h-[min(125vw,72svh)] lg:h-full">
          <m.div layoutId={`trend-media-${trendId}`} className="absolute inset-0 overflow-hidden bg-cream" style={{ borderRadius: 0 }} transition={spring.layout}>
            <Parallax depth={isShoeCategory(category) ? 0 : 4} bleed={!isShoeCategory(category)} className="absolute inset-0">
              <GalleryPhoto key={image} src={image} alt={`${title}${images.length > 1 ? ` — photo ${active + 1} of ${images.length}` : ""}`} className={isShoeCategory(category) ? productImageFit(category) : "object-contain lg:object-cover"} />
            </Parallax>
          </m.div>
          <button
            ref={openerRef}
            type="button"
            disabled={!image}
            onPointerDown={startSwipe}
            onPointerUp={finishSwipe}
            onPointerCancel={() => { startRef.current = null; }}
            onClick={(event) => { if (swipedRef.current) { event.preventDefault(); swipedRef.current = false; return; } setOpen(true); }}
            aria-label={`View product photo ${active + 1} full screen`}
            className="absolute inset-0 touch-pan-y cursor-zoom-in focus-visible:outline-offset-[-4px] disabled:cursor-default"
          />
          {image && <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-paper/95 px-3 py-2 text-[11px] font-semibold text-ink shadow-card lg:bottom-auto lg:top-4">
            <Expand className="size-3.5" /> Tap to enlarge
          </span>}
          {score > 0 && <m.div
            className={`pointer-events-none absolute bottom-3 left-3 z-10 lg:left-8 ${images.length > 1 ? "lg:bottom-24" : "lg:bottom-8"}`}
            initial={{ scale: 1.5, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -6, opacity: 1 }}
            transition={{ ...spring.settle, delay: 0.3 }}
          ><Stamp score={score} size="lg" className="shadow-print" /></m.div>}
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-1.5 border-y border-border bg-paper p-2.5 lg:absolute lg:inset-x-3 lg:bottom-3 lg:z-20 lg:rounded-2xl lg:border-0 lg:bg-paper/95 lg:p-2 lg:shadow-card" role="group" aria-label="Product photos"
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); select(active + (event.key === "ArrowRight" ? 1 : -1)); }
            }}>
            <button type="button" aria-label="Previous product photo" className="grid size-11 shrink-0 place-items-center rounded-full text-ink/75 hover:bg-ink/5" onClick={() => select(active - 1)}><ArrowLeft className="size-4" /></button>
            <div ref={railRef} className="no-scrollbar relative flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {images.map((src, photo) => <button type="button" key={src} aria-label={`Show product photo ${photo + 1}`} aria-pressed={photo === active}
                onClick={() => select(photo)} className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 lg:size-12 ${photo === active ? "border-clay" : "border-transparent"}`}>
                <Img src={src} alt="" draggable={false} className={`h-full w-full ${productImageFit(category, true)}`} />
              </button>)}
            </div>
            <span className="px-1 text-xs tabular-nums text-ink/70" aria-live="polite" aria-atomic="true">{active + 1}/{images.length}</span>
            <button type="button" aria-label="Next product photo" className="grid size-11 shrink-0 place-items-center rounded-full text-ink/75 hover:bg-ink/5" onClick={() => select(active + 1)}><ArrowRight className="size-4" /></button>
          </div>
        )}
      </PointerScope>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/95" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[81] flex h-[100dvh] flex-col bg-black text-white outline-none"
          aria-describedby="product-photo-help"
          onOpenAutoFocus={(event) => { event.preventDefault(); closeRef.current?.focus({ preventScroll: true }); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); openerRef.current?.focus({ preventScroll: true }); }}
          onKeyDown={(event) => {
            if (!zoomed && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); select(active + (event.key === "ArrowRight" ? 1 : -1)); }
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-sm font-semibold">{title}</DialogPrimitive.Title>
              <p className="mt-1 text-xs text-white/65">Photo {active + 1} of {images.length}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" aria-label={zoomed ? "Zoom out product photo" : "Zoom in product photo"} aria-pressed={zoomed} className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" onClick={() => setZoomed((value) => !value)}>
                {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
              </button>
              <DialogPrimitive.Close ref={closeRef} aria-label="Close full-screen photo" className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="size-5" /></DialogPrimitive.Close>
            </div>
          </div>
          <div ref={viewportRef} className={`min-h-0 flex-1 overscroll-contain ${zoomed ? "touch-auto overflow-auto cursor-grab active:cursor-grabbing" : "touch-pan-y overflow-hidden"}`}
            onPointerDown={(event) => {
              if (!zoomed) return startSwipe(event);
              if (event.pointerType === "touch" || !event.isPrimary) return;
              panRef.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const pan = panRef.current;
              if (!pan || !zoomed) return;
              event.currentTarget.scrollLeft = pan.left + pan.x - event.clientX;
              event.currentTarget.scrollTop = pan.top + pan.y - event.clientY;
            }}
            onPointerUp={(event) => { panRef.current = null; if (!zoomed) finishSwipe(event); }}
            onPointerCancel={() => { startRef.current = null; panRef.current = null; }}
            onDoubleClick={() => setZoomed((value) => !value)}>
            <div className={zoomed ? "h-[200%] w-[200%]" : "h-full w-full"}>
              <GalleryPhoto key={image} src={image} alt={`${title} — photo ${active + 1}`} className="select-none object-contain" />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/15 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3">
            <button type="button" aria-label="Previous full-screen photo" disabled={images.length < 2} className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 disabled:opacity-30" onClick={() => select(active - 1)}><ArrowLeft className="size-5" /></button>
            <DialogPrimitive.Description id="product-photo-help" className="max-w-[18rem] text-center text-xs leading-relaxed text-white/65">
              {zoomed ? "Drag to move around. Tap zoom out to see the full photo." : images.length > 1 ? "Swipe for more photos. Tap zoom for a closer look." : "Tap zoom for a closer look."}
            </DialogPrimitive.Description>
            <button type="button" aria-label="Next full-screen photo" disabled={images.length < 2} className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 disabled:opacity-30" onClick={() => select(active + 1)}><ArrowRight className="size-5" /></button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
