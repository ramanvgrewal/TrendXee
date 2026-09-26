import { useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Sparkles, Bookmark, Trash2, Edit3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProductMatch, Trend } from "@/lib/mock-data";
import { Stamp } from "@/components/Stamp";
import { archiveTrend, unarchiveTrend, getArchiveStatus, deleteTrendPermanently, updateTrendPrice } from "@/lib/archiveApi";
import { businessApiFetch } from "@/lib/api";

type Source = "underdog" | "amazon" | "flipkart";
const sourceLabels: Record<Source, string> = {
  underdog: "The Underdog",
  amazon: "Amazon",
  flipkart: "Flipkart",
};

const trackClick = (trendId: string, source: Source, url: string) => {
  businessApiFetch("/api/analytics/click", {
    method: 'POST',
    body: JSON.stringify({ trendId, source, url }),
    keepalive: true,
  }).catch(err => console.error("Failed to track click", err));
};

function UnderdogHero({ product, trendId, isSneaker, fill }: { product: ProductMatch; trendId: string; isSneaker?: boolean; fill?: boolean }) {
  return (
    <a
      href={product.shopUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick(trendId, 'underdog', product.shopUrl)}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-cream ring-1 ring-clay/35 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className={`relative w-full overflow-hidden bg-paper ${fill ? "min-h-0 flex-1" : "aspect-[4/5]"}`}>
        {isSneaker && (
          <img
            src={product.imageUrl}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
          />
        )}
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${
            isSneaker
              ? "relative z-10 object-contain p-4"
              : "absolute inset-0 object-cover"
          }`}
        />
        <span className="absolute left-4 top-4 z-20 rounded-full bg-clay px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper">
          the underdog
        </span>
      </div>
      <div className={`p-6 ${fill ? "" : "flex-1"}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">
          {product.brandName ?? "indie brand"}
        </p>
        <p className="mt-1 line-clamp-2 font-display text-lg leading-snug tracking-tight">
          {product.title}
        </p>
        <p className="mt-2 flex items-center justify-between font-display text-2xl">
          {product.currency}{product.price?.toLocaleString() ?? "N/A"}
          <ExternalLink className="size-4 text-ink/40 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </a>
  );
}

function CompactProduct({ source, product, trendId, isSneaker }: { source: Source; product: ProductMatch; trendId: string; isSneaker?: boolean }) {
  return (
    <a
      href={product.shopUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick(trendId, source, product.shopUrl)}
      className="group flex flex-col overflow-hidden rounded-xl bg-cream/70 ring-1 ring-border transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-paper">
        {isSneaker && (
          <img
            src={product.imageUrl}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
          />
        )}
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${
            isSneaker
              ? "relative z-10 object-contain p-2"
              : "absolute inset-0 object-cover"
          }`}
        />
        <span className="absolute left-2 top-2 z-20 rounded-full bg-paper/85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ink/70">
          {sourceLabels[source]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
          {product.brandName}
        </p>
        <p className="line-clamp-2 text-[12px] font-semibold text-ink/80">
          {product.title}
        </p>
        <p className="mt-auto flex items-center justify-between font-display text-base">
          {product.currency}{product.price?.toLocaleString() ?? "N/A"}
          <ExternalLink className="size-3.5 text-ink/40" />
        </p>
      </div>
    </a>
  );
}

function MainstreamPicks({ products, trendId, isSneaker }: { products: { source: Source; product?: ProductMatch }[]; trendId: string; isSneaker?: boolean }) {
  const validProducts = products.filter((p) => p.product);
  if (validProducts.length === 0) return null;

  return (
    <div>
      <p className="hand text-sm text-ink/60">mainstream picks</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {validProducts.map(
          ({ source, product }) =>
            product && <CompactProduct key={source} source={source} product={product} trendId={trendId} isSneaker={isSneaker} />,
        )}
      </div>
    </div>
  );
}

export function TrendCard({ trend: initialTrend, isArchivedContext = false, onUnarchive }: { trend: Trend; isArchivedContext?: boolean; onUnarchive?: () => void }) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(isArchivedContext);
  const [isHovered, setIsHovered] = useState(false);
  const [trend, setTrend] = useState(initialTrend);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: user } = useQuery({ queryKey: ['currentUser'] });
  const isAdmin = user?.email === "ramanvgrewal@gmail.com";

  const isSneaker = trend.aestheticId?.toLowerCase().includes("sneaker") || trend.name.toLowerCase().includes("sneaker") || trend.name.toLowerCase().includes("kick");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getArchiveStatus(trend.id);
        setIsArchived(status);
      } catch (e) {
        console.error(e);
      }
    };
    if (!isArchivedContext) {
      checkStatus();
    }
  }, [trend.id, isArchivedContext]);

  const handleArchiveClick = async () => {
    try {
      if (isArchived) {
        if (window.confirm("Are you sure you want to unarchive this trend? If this trend is no longer in the main feed, it will be gone permanently.")) {
          await unarchiveTrend(trend.id);
          setIsArchived(false);
          if (onUnarchive) onUnarchive();
        }
      } else {
        await archiveTrend(trend.id);
        setIsArchived(true);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update archive status. Are you logged in?");
    }
  };

  const mainstream: { source: Source; product?: ProductMatch }[] = [
    { source: "amazon", product: trend.products?.amazon },
    { source: "flipkart", product: trend.products?.flipkart },
  ];

  const handleEditPrice = async () => {
    const currentPrice = trend.products?.underdog?.price || trend.estimatedPrice || 0;
    const newPriceStr = window.prompt("Enter new price (numbers only):", String(currentPrice));
    if (newPriceStr === null) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice)) {
      alert("Invalid price.");
      return;
    }
    try {
      await updateTrendPrice(trend.id, newPrice);
      setTrend(prev => ({
        ...prev,
        estimatedPrice: newPrice,
        products: {
          ...prev.products,
          underdog: prev.products?.underdog ? { ...prev.products.underdog, price: newPrice } : undefined,
        },
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to update price.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this trend?")) {
      try {
        await deleteTrendPermanently(trend.id);
        setIsDeleted(true);
      } catch (e) {
        console.error(e);
        alert("Failed to delete trend.");
      }
    }
  };

  const tiltIndex = trend.name.length % 2;
  const tilt = tiltIndex === 0 ? "-0.5deg" : "0.6deg";

  if (isDeleted) return null;

  return (
    <article
      className="animate-settle rounded-2xl bg-paper p-4 ring-1 ring-border sm:p-6"
      style={{ "--tilt": tilt } as React.CSSProperties}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
        {/* Story side + mainstream picks */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-olive">
            <span className="size-1.5 animate-pulse rounded-full bg-olive" /> {trend.active ? "active drop" : "archived"}
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-3xl">
              {trend.name}
            </h3>
            <button
              onClick={handleArchiveClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label={isArchived ? `Remove ${trend.name} from archive` : `Archive ${trend.name}`}
              aria-pressed={isArchived}
              className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-50 ${
                isArchived
                  ? "border-clay bg-clay text-paper"
                  : "border-border text-ink/50 hover:border-clay hover:text-clay"
              }`}
            >
              <Bookmark className="size-4" fill={isArchived || isHovered ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Stamp score={Math.round(trend.trendScore)} size="lg" tone={tiltIndex === 0 ? "clay" : "olive"} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/55">
              trend score
              <br />
              {trend.totalSignals} signals
              {trend.signalProducts.length > 0 && ` · ${trend.signalProducts.length} shoppable`}
              {trend.indiaRelevant && " · India"}
            </p>
          </div>

          {trend.vibeTags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {trend.vibeTags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-input px-3 py-1 text-[11px] font-semibold text-ink/60"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}

          {trend.whyTrending.length > 0 && (
            <div className="mt-5">
              <p className="hand text-sm text-ink/60">why it's trending</p>
              <ul className="mt-2 space-y-1.5">
                {trend.whyTrending.map((reason) => (
                  <li key={reason} className="flex gap-2 text-[14px] leading-relaxed text-ink/75">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-clay" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile: underdog then mainstream picks */}
          {trend.products?.underdog && (
            <div className="mt-6 lg:hidden">
              <UnderdogHero product={trend.products.underdog} trendId={trend.id} isSneaker={isSneaker} />
            </div>
          )}
          <div className="mt-6 lg:hidden">
            <MainstreamPicks products={mainstream} trendId={trend.id} isSneaker={isSneaker} />
          </div>

          {/* AI Summary toggle */}
          <div className="mt-6 rounded-2xl border border-border bg-cream/50">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-cream/80"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">
                <Sparkles className="size-3" /> AI Summary
              </span>
              <ChevronDown
                className={`size-4 text-ink/40 transition-transform ${summaryOpen ? "rotate-180" : ""}`}
              />
            </button>
            {summaryOpen && (
              <div className="border-t border-border px-4 py-4">
                <p className="text-[15px] leading-relaxed text-ink/75">{trend.aiSummary}</p>
              </div>
            )}
          </div>

          {/* Desktop mainstream picks */}
          <div className="mt-6 hidden lg:block">
            <MainstreamPicks products={mainstream} trendId={trend.id} isSneaker={isSneaker} />
          </div>

          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border">
              <span className="w-full text-[10px] font-bold uppercase tracking-[0.16em] text-destructive">Admin Tools</span>
              <button
                onClick={handleEditPrice}
                className="flex items-center gap-1.5 rounded-md border border-clay/30 bg-clay/10 px-3 py-1.5 text-xs font-semibold text-clay transition-colors hover:bg-clay/20"
              >
                <Edit3 className="size-3" /> Edit Price
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Desktop: underdog right column */}
        {trend.products?.underdog && (
          <div className="hidden h-full min-h-0 flex-col lg:flex">
            <UnderdogHero product={trend.products.underdog} trendId={trend.id} isSneaker={isSneaker} fill />
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border/50 pt-4 text-center">
        <p className="text-[11px] text-ink/40 leading-relaxed">
          TrendXee is a discovery platform. You will be redirected to the third-party brand/store to view or purchase this product. TrendXee does not sell or fulfil this product.
        </p>
      </div>
    </article>
  );
}
