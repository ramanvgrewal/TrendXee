export type JournalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  tips?: string[];
};

export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Field notes" | "Style guide" | "Behind the board";
  publishedAt: string;
  author: string;
  cover: "discovery" | "denim" | "layers";
  coverLine: string;
  introduction: string;
  sections: JournalSection[];
  lane: string;
  laneLabel: string;
};

// Editorial content ships with the site. No storefront data or product records
// are copied here, so an article never promises a stale price or availability.
export const journalArticles: JournalArticle[] = [
  {
    slug: "why-we-built-trendxee",
    title: "Good clothes. Smaller labels. Less searching.",
    excerpt: "Why we built a discovery board for Indian indie fashion, and how to use it to find your next fit.",
    category: "Behind the board",
    publishedAt: "2026-10-27",
    author: "Raman Grewal",
    cover: "discovery",
    coverLine: "Underdogs, in focus.",
    introduction: "Finding a piece you like is easy. Finding it again, remembering the label, and working out what to wear with it takes more effort. TrendXee brings those steps into one place.",
    sections: [
      {
        id: "start-with-a-lane",
        title: "Start with what your wardrobe needs",
        paragraphs: [
          "Instead of opening another endless feed, pick a lane: tees, outerwear, jeans, bottoms, anime, shoes, sportswear, polos & regular, or caps & accessories. Each gives you a smaller place to explore.",
          "Open a product to see its gallery, brand information and a link to the retailer. You buy from that store; TrendXee is a discovery site and does not take your order or handle delivery.",
        ],
      },
      {
        id: "read-the-signals",
        title: "Treat scores as a starting point",
        paragraphs: [
          "Brand Hype describes Instagram signals when usable analytics are available. It is separate from ratings and community reviews. A score is a clue to investigate, rather than a promise about quality, fit or customer service.",
          "When usable Instagram analytics are missing, hype is unmeasured. That does not establish whether a brand is good or bad. Before ordering, check the retailer's current size chart, return terms, delivery information and price.",
        ],
      },
      {
        id: "make-an-outfit",
        title: "Go from a piece to an outfit",
        paragraphs: [
          "The Pair up with section suggests complementary pieces from the catalogue. It uses product information and compatibility rules to surface options across lanes. It does not know your measurements or guarantee a personal fit.",
          "Use the suggestions as a shortlist: compare silhouettes, choose the shoes you would actually wear, and save pieces to your archive if you want to return to them. The best outfit is still the one that feels right to you.",
        ],
      },
      {
        id: "help-shape-the-board",
        title: "Help us make discovery more useful",
        paragraphs: [
          "We are building around a simple question: does this help you find something you would otherwise have missed? A missing label, an unhelpful pairing or a confusing filter is useful feedback.",
          "Tell us what you came to find, what got in your way and what you would change. Specific experiences help us improve the board more than a score on its own.",
        ],
      },
    ],
    lane: "tees",
    laneLabel: "Explore tees",
  },
  {
    slug: "how-to-style-baggy-jeans",
    title: "Baggy jeans, without overthinking the rest.",
    excerpt: "A practical way to balance wider denim with tees, layers and shoes you already own.",
    category: "Style guide",
    publishedAt: "2026-10-27",
    author: "TrendXee editorial",
    cover: "denim",
    coverLine: "A little more room.",
    introduction: "Baggy denim gives an outfit shape before you add anything else. Start with its width and length, then let the other pieces work around it.",
    sections: [
      {
        id: "choose-the-shape",
        title: "Choose the shape before the label",
        paragraphs: [
          "Baggy, wide-leg and relaxed are useful search terms, but brands use them differently. Look at the rise, thigh room, leg opening and measurements together. A model photograph can suggest the silhouette; it cannot tell you how the same pair will fit your body.",
          "Compare the measurements with jeans you already like. Decide whether you want a loose leg all the way down or a more curved shape with a narrower opening. Neither needs a completely new wardrobe.",
        ],
      },
      {
        id: "balance-the-top",
        title: "Give the top a clear stopping point",
        paragraphs: [
          "A regular tee makes an easy starting point. Let it end near the waistband or use a small front tuck if you want the jeans' rise to show. A closer-fitting top can give a wider leg more definition, while an oversized tee creates a looser overall silhouette.",
          "If the outfit feels shapeless, change one proportion first. Try a shorter layer, a different tuck or a slightly less wide tee before replacing everything.",
        ],
        tips: ["Regular tee + baggy denim + low-profile trainers.", "Closer-fitting tank + wide-leg denim + an open overshirt.", "Boxy jacket + simple base layer + relaxed denim."],
      },
      {
        id: "check-the-hem",
        title: "Check where the hem meets your shoes",
        paragraphs: [
          "Put the jeans on with the shoes you expect to wear most. A little fabric resting on the shoe can look intentional; a hem dragging under your heel usually becomes inconvenient quickly.",
          "Slimmer trainers keep the base quiet. A chunkier shoe gives a wide opening something to sit over. Check the outfit from the side as well as the front, and choose a length you can comfortably walk in.",
        ],
      },
      {
        id: "keep-one-anchor",
        title: "Keep one thing simple",
        paragraphs: [
          "If the denim has heavy fading, prints or extra pockets, try a quieter top first. If the jeans are plain, the tee or jacket can carry more colour. This is a starting point rather than a dress code.",
          "Use the Jeans lane to compare silhouettes, then open Pair up with for complementary options. Check each retailer's current measurements and return policy before you order.",
        ],
      },
    ],
    lane: "jeans",
    laneLabel: "Find your denim",
  },
  {
    slug: "choosing-a-tee-for-layering",
    title: "The quiet tee that makes a jacket work.",
    excerpt: "Neckline, sleeve, length and fabric: four things to check when choosing a base layer.",
    category: "Field notes",
    publishedAt: "2026-10-27",
    author: "TrendXee editorial",
    cover: "layers",
    coverLine: "Start underneath.",
    introduction: "A jacket can be the main event, but its base layer changes the whole outfit. A plain or restrained regular-fit tee is often the easiest place to start.",
    sections: [
      {
        id: "start-at-the-neck",
        title: "Start at the neckline",
        paragraphs: [
          "A crew neck gives an open jacket a clean frame. Check how high it sits and whether you like the amount of tee visible. A tank creates a more open line, while a higher neckline makes the layers feel closer together.",
          "Try the combination with the jacket both open and closed. The base layer should feel comfortable around your neck and shoulders in either position.",
        ],
      },
      {
        id: "leave-room",
        title: "Leave room inside the jacket",
        paragraphs: [
          "A regular or closer fit is usually easier to layer beneath a fitted jacket than a very wide tee. Under a roomier overshirt, you have more freedom. Pay attention to fabric gathering around the upper arm and underarm.",
          "Move your arms, sit down and reach forward. If the layers bunch or pull, try less sleeve volume or a different jacket size. The right combination should work beyond a mirror photograph.",
        ],
      },
      {
        id: "check-the-length",
        title: "Decide how much hem to show",
        paragraphs: [
          "A tee finishing near the jacket hem keeps the outline simple. A longer tee can add another visible layer, but the difference should feel deliberate. Check the side view and try a tuck before deciding the piece is wrong.",
          "Colour can do some of the work too. A quiet neutral lets the outer layer stand out; a contrasting tee makes the opening of the jacket more noticeable.",
        ],
      },
      {
        id: "fabric-and-weather",
        title: "Match the fabric to the day",
        paragraphs: [
          "Fabric weight, texture and your local weather matter more than a label such as essential. A lighter base can feel easier under a substantial jacket; a heavier tee can hold its shape when you take that jacket off.",
          "Browse Polos & Regular for everyday base layers and Outerwear for jackets and overshirts. Compare fabric details and measurements at the store, then use Pair up with to explore alternatives around the piece you like.",
        ],
      },
    ],
    lane: "polos",
    laneLabel: "Explore everyday layers",
  },
];

export function findJournalArticle(slug: string) {
  return journalArticles.find((article) => article.slug === slug);
}

export function readingMinutes(article: JournalArticle) {
  const text = [article.introduction, ...article.sections.flatMap((s) => [s.title, ...s.paragraphs, ...(s.tips || [])])].join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

export function journalDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${date}T00:00:00+05:30`));
}
