import { useEffect, useRef, useState } from "react";
import { thumbnailSource } from "@/lib/image-url";

/**
 * Product photography for the board.
 *
 * - Images that arrive after hydration fade in instead of popping.
 *   Server-rendered images are never hidden: the fade only applies to images
 *   that are still loading once JavaScript is running.
 * - Brand stores sometimes drop images without warning; a failed image
 *   becomes a quiet paper swatch with an optional label, never a broken icon.
 */
export function Img(props: React.ComponentProps<typeof ProductImage>) {
  return <ProductImage key={props.src} {...props} />;
}

function ProductImage({
  src,
  alt = "",
  className = "",
  eager = false,
  priority = false,
  fallbackLabel,
  draggable,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  eager?: boolean;
  priority?: boolean;
  fallbackLabel?: string;
  draggable?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"ssr" | "loading" | "loaded" | "error">("ssr");
  const [useOriginal, setUseOriginal] = useState(false);
  const displaySource = useOriginal ? src : thumbnailSource(src, priority ? 1440 : 960);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (!img.complete) setStatus("loading");
    else if (img.naturalWidth > 0) setStatus("loaded");
    else if (!useOriginal && displaySource !== src) {
      // A cached failure can happen before hydration attaches onError.
      setUseOriginal(true); setStatus("ssr");
    } else setStatus("error");
  }, [displaySource, src, useOriginal]);

  if (!src || status === "error") {
    return (
      <div aria-hidden className={`grid place-items-center bg-cream ${className}`}>
        {fallbackLabel && <span className="font-display text-2xl italic text-ink/30">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={displaySource || src}
      alt={alt}
      draggable={draggable}
      loading={eager || priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onLoad={() => setStatus("loaded")}
      onError={() => {
        if (!useOriginal && displaySource !== src) { setUseOriginal(true); setStatus("ssr"); }
        else setStatus("error");
      }}
      // Inline so it composes with any hover-scale utility a caller adds.
      style={{ transition: "opacity 0.5s ease-out, scale 1.1s cubic-bezier(0.2, 0.7, 0.2, 1), transform 1.1s cubic-bezier(0.2, 0.7, 0.2, 1)" }}
      className={`${status === "loading" ? "opacity-0" : "opacity-100"} ${className}`}
    />
  );
}
