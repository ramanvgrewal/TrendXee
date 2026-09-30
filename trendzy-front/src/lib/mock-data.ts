export interface Aesthetic {
  id: string;
  name: string;
  description: string;
  signalCount: number;
  trendScore: number;
  colorPalette: string[];
  heroImage: string;
  vibeTags: string[];
  underdogRotation?: { brand: string; title: string; image: string }[];
}

export interface ProductMatch {
  brandName: string;
  title: string;
  price: number;
  originalPrice?: number;
  priceType?: string;
  currency: string;
  imageUrl: string;
  shopUrl: string;
}

export interface ProductTriad {
  underdog?: ProductMatch;
  amazon?: ProductMatch;
  flipkart?: ProductMatch;
}

export interface SignalProduct extends ProductTriad {
  signalId: string;
  authorUsername: string;
  queryUsed: string;
}

export interface Trend {
  id: string;
  name: string;
  aestheticId: string;
  trendScore: number;
  vibeTags: string[];
  aiSummary: string;
  whyTrending: string[];
  indiaRelevant: boolean;
  totalSignals: number;
  supportingSignals: string[];
  enrichmentStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  products: ProductTriad;
  signalProducts: SignalProduct[];
  estimatedPrice: number;
  lastUpdatedAt: string;
  active: boolean;
  subcategory?: string;
}
export const aesthetics: Aesthetic[] = [
    {
    id: "tees",
    name: "TEES",
    description: "Graphic tees, vintage washes, and oversized fits dominating the torso.",
    signalCount: 3200,
    trendScore: 85,
    colorPalette: ["#0f172a", "#334155", "#64748b", "#cbd5e1"],
    heroImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&q=80",
    vibeTags: ["graphic", "vintage", "oversized", "tee"],
    underdogRotation: []
  },
    {
    id: "outerwear",
    name: "OUTERWEAR",
    description: "Denim, bombers, varsity jackets and overshirts defining the silhouette.",
    signalCount: 4500,
    trendScore: 92,
    colorPalette: ["#1c1917", "#44403c", "#78716c", "#d6d3d1"],
    heroImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80",
    vibeTags: ["jacket", "bomber", "varsity", "denim"],
    underdogRotation: []
  },
    {
    id: "bottoms",
    name: "BOTTOMS",
    description: "Baggy jeans, parachute pants, cargo and joggers stacking over sneakers.",
    signalCount: 3980,
    trendScore: 88,
    colorPalette: ["#a3a3a3", "#525252", "#f5f5f4", "#0f172a"],
    heroImage: "https://images.unsplash.com/photo-1584865288642-42078afe6942?w=900&q=80",
    vibeTags: ["baggy", "cargo", "parachute", "stacked"],
    underdogRotation: []
  },
    {
    id: "anime",
    name: "ANIME",
    description: "The latest anime graphics and collabs across hoodies, tees and more.",
    signalCount: 4100,
    trendScore: 90,
    colorPalette: ["#f87171", "#ef4444", "#b91c1c", "#7f1d1d"],
    heroImage: "https://images.unsplash.com/photo-1614050212353-8386de6a15d2?w=900&q=80",
    vibeTags: ["anime", "graphic", "collab", "otaku"],
    underdogRotation: []
  },
    {
    id: "sneakers",
    name: "SNEAKERS",
    description: "Chunky kicks, retro runners, and the grails taking over your feed.",
    signalCount: 5120,
    trendScore: 96,
    colorPalette: ["#7f1d1d", "#dc2626", "#fca5a5", "#fef2f2"],
    heroImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=80",
    vibeTags: ["chunky", "retro", "runner", "grail"],
    underdogRotation: []
  },
    {
    id: "sportswear",
    name: "SPORTSWEAR",
    description: "Compression layers, stringers and the fit-gear dominating gym-tok.",
    signalCount: 1890,
    trendScore: 78,
    colorPalette: ["#facc15", "#78716c", "#1c1917", "#e7e5e4"],
    heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80",
    vibeTags: ["stringer", "tapered", "compression", "fit-gear"],
    underdogRotation: []
  },
    {
    id: "polos",
    name: "POLOS",
    description: "Classic, zip-up, and textured polos bringing back the old-money vibe.",
    signalCount: 2200,
    trendScore: 81,
    colorPalette: ["#fde047", "#eab308", "#a16207", "#713f12"],
    heroImage: "https://images.unsplash.com/photo-1618453292459-53424b66bb6a?w=900&q=80",
    vibeTags: ["classic", "zip-up", "textured", "old-money"],
    underdogRotation: []
  },
    {
    id: "caps",
    name: "CAPS",
    description: "Trucker caps, snapbacks and statement headwear that finish the fit and turn a look into a signature.",
    signalCount: 2610,
    trendScore: 82,
    colorPalette: ["#e5e7eb", "#9ca3af", "#f59e0b", "#111827"],
    heroImage: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=900&q=80",
    vibeTags: ["trucker", "snapback", "logo", "headwear"],
    underdogRotation: []
  },
    {
    id: "fragrances",
    name: "FRAGRANCES",
    description: "Niche perfumers and the bottles TikTok fragrance-tok wont shut up about.",
    signalCount: 2140,
    trendScore: 84,
    colorPalette: ["#f5d0fe", "#c084fc", "#a855f7", "#1e1b4b"],
    heroImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80",
    vibeTags: ["niche", "gourmand", "oud", "cloud"],
    underdogRotation: []
  }
  ];
export const trends: Trend[] = [
  {
    id: "trend_sw_001",
    name: "Washed Baggy Carpenter Denim",
    aestheticId: "outerwear",
    trendScore: 94,
    vibeTags: ["baggy", "carpenter", "washed", "stacked"],
    aiSummary:
      "Loose carpenter jeans in dusty mid-wash indigo are eating the fit-check feed this week. Creators are stacking them over chunky sneakers with boxy graphic tees — the silhouette reads skate-shop meets 2003 Y2K, not TikTok-core Y2K. The winning cut sits low on the hips, breaks hard at the ankle, and always shows a hammer loop.",
    whyTrending: [
      "3 top creators posted haul reels in the last 7 days.",
      "Amazon India search up 68% month-over-month.",
    ],
    indiaRelevant: true,
    totalSignals: 214,
    supportingSignals: Array.from({ length: 18 }, (_, i) => `sig_${i}`),
    enrichmentStatus: "COMPLETED",
    estimatedPrice: 2499,
    lastUpdatedAt: "2026-07-08T09:12:00Z",
    active: true,
    products: {
      underdog: {
        brandName: "Bluorng",
        title: "Faded Indigo Carpenter Jean — Low Rise",
        price: 3499,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1584865288642-42078afe6942?w=800&q=80",
        shopUrl: "#",
      },
      amazon: {
        brandName: "Levi's",
        title: "568 Loose Straight Carpenter Jean — Stonewash",
        price: 2799,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=800&q=80",
        shopUrl: "#",
      },
      flipkart: {
        brandName: "Roadster",
        title: "Baggy Fit Cotton Carpenter Jeans — Light Blue",
        price: 1499,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80",
        shopUrl: "#",
      },
    },
    signalProducts: [],
  },
  {
    id: "trend_sw_002",
    name: "Boxy Acid-Wash Graphic Tee",
    aestheticId: "outerwear",
    trendScore: 89,
    vibeTags: ["boxy", "acid-wash", "graphic", "vintage"],
    aiSummary:
      "Short, wide, boxy tees in bleached acid-wash finishes with faded band-tour or racing graphics are the new default top-layer. The cut is deliberately cropped — hitting mid-belt on baggy denim — and the wash reads 'thrifted 2004', not 'AI-generated print'. Best paired with a plain white long sleeve underneath.",
    whyTrending: [
      "TikTok #boxytee saw a 3.2x view spike in 14 days.",
      "41% of carpenter-denim reels pair it with an acid-wash top.",
    ],
    indiaRelevant: true,
    totalSignals: 176,
    supportingSignals: Array.from({ length: 12 }, (_, i) => `sig2_${i}`),
    enrichmentStatus: "COMPLETED",
    estimatedPrice: 1299,
    lastUpdatedAt: "2026-07-08T06:40:00Z",
    active: true,
    products: {
      underdog: {
        brandName: "Almost Gods",
        title: "Acid-Wash Racing Boxy Tee — Bleached Black",
        price: 1899,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
        shopUrl: "#",
      },
      amazon: {
        brandName: "H&M",
        title: "Boxy Fit Washed Graphic T-Shirt — Vintage Blue",
        price: 999,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        shopUrl: "#",
      },
      flipkart: {
        brandName: "Bewakoof",
        title: "Oversized Acid Wash Printed Tee — Faded Grey",
        price: 649,
        currency: "₹",
        imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
        shopUrl: "#",
      },
    },
    signalProducts: [],
  },
];

export function getTrendsForAesthetic(aestheticId: string): Trend[] {
  return trends.filter((t) => t.aestheticId === aestheticId);
}

export function paletteVars(palette: string[]): React.CSSProperties {
  const [a, b, c, d] = [...palette, ...palette].slice(0, 4);
  return {
    ["--aesthetic-1" as string]: a,
    ["--aesthetic-2" as string]: b,
    ["--aesthetic-3" as string]: c,
    ["--aesthetic-4" as string]: d,
  };
}
