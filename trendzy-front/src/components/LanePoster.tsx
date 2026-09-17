import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Photo } from "@/components/Photo";
import type { Aesthetic } from "@/lib/mock-data";

export function LanePoster({
  aesthetic,
  index,
  rotationImages = [],
  heroOverride,
  className = "",
}: {
  aesthetic: Aesthetic;
  index: number;
  rotationImages?: { brand: string; title: string; image: string }[];
  heroOverride?: string;
  className?: string;
}) {
  const laneEmoji: Record<string, string> = {
    streetwear: "👕",
    upper: "🎽",
    sneakers: "👟",
    bottoms: "👖",
    caps: "🧢",
    sportswear: "💪",
    fragrances: "🧴",
  };
  const emoji = laneEmoji[aesthetic.id] ?? "✦";
  const isSneaker = aesthetic.id === "sneakers" || aesthetic.name.toLowerCase().includes("sneaker");
  
  const rotation = rotationImages;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (rotation.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % rotation.length), 2800 + index * 300);
    return () => clearInterval(t);
  }, [rotation.length, index]);

  const defaultHero = heroOverride || aesthetic.heroImage;

  return (
    <Link
      to="/aesthetic/$id"
      params={{ id: aesthetic.id }}
      className={`group relative block h-[340px] shrink-0 snap-start overflow-hidden rounded-2xl bg-cream ring-1 ring-border transition-transform duration-300 hover:-translate-y-1 sm:h-[380px] ${className}`}
    >
      <div className="absolute inset-0 bg-paper">
        {rotation.length > 0 ? (
          rotation.map((r, i) => (
            <div
              key={`${r.image}-${i}`}
              className={`absolute inset-0 size-full transition-opacity duration-700 ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
            >
              {isSneaker && (
                <img
                  src={r.image}
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
                />
              )}
              <img
                src={r.image}
                alt={r.title}
                loading="lazy"
                className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04] ${
                  isSneaker ? "z-10 object-contain p-4" : "object-cover"
                }`}
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 size-full">
             {isSneaker && (
                <img
                  src={defaultHero}
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
                />
              )}
              <img
                src={defaultHero}
                alt={`${aesthetic.name} trends`}
                loading="lazy"
                className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04] ${
                  isSneaker ? "z-10 object-contain p-4" : "object-cover"
                }`}
              />
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-20 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/25" />

      <span className="absolute left-4 top-4 z-30 font-mono text-[13px] font-bold tracking-[0.16em] text-sand/80">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute right-4 top-4 z-30 grid size-10 place-items-center rounded-full bg-paper/90 text-lg">
        {emoji}
      </span>

      <div className="absolute inset-x-0 bottom-0 z-30 p-5">
        <h3 className="font-display text-2xl tracking-tight text-sand">{aesthetic.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em]">
          <span className="text-sand/70">
            {aesthetic.signalCount.toLocaleString("en-IN")} signals
          </span>
          <span className="text-clay">score {aesthetic.trendScore}</span>
        </div>
      </div>
    </Link>
  );
}
