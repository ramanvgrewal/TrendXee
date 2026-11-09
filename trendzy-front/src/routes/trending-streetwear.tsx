import { createFileRoute, Link } from "@tanstack/react-router";
import { Cta, CtaArrow, ctaClass } from "@/components/Cta";
import { LaneCard } from "@/components/LaneCard";
import { normalizeAudienceFilter } from "@/lib/audience";
import { fetchLaneRotations, LANE_COVER_STALE_TIME } from "@/lib/lanes";
import { aesthetics } from "@/lib/mock-data";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/trending-streetwear")({
  loaderDeps: ({ search }) => ({ audience: normalizeAudienceFilter(search.audience) }),
  loader: async ({ deps }) => ({ rotationMap: await fetchLaneRotations(deps.audience) }),
  staleTime: LANE_COVER_STALE_TIME,
  head: () => pageSeo({
    title: "Discover Trending Streetwear Brands in India | TrendXee",
    description: "Explore Indian streetwear brands, oversized tees, baggy jeans and fresh drops. Compare brand details and discover your next fit on TrendXee.",
    path: "/trending-streetwear",
  }),
  component: StreetwearPage,
});

const streetwearLaneIds = new Set(["tees", "outerwear", "jeans", "bottoms", "caps"]);
const streetwearLanes = aesthetics.filter((lane) => streetwearLaneIds.has(lane.id));
const guides = [
  {
    slug: "how-to-style-baggy-jeans",
    title: "How to style baggy jeans",
    description: "Balance wider denim with tees, layers and shoes you already own.",
  },
  {
    slug: "choosing-a-tee-for-layering",
    title: "Choose a tee for layering",
    description: "Check the neckline, sleeves, length and fabric before adding a jacket.",
  },
];

function StreetwearPage() {
  const { rotationMap } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-12 sm:px-8 lg:pt-20">
      <header className="max-w-5xl">
        <p className="eyebrow text-clay-ink">Streetwear discovery / India</p>
        <h1 className="mt-4 text-balance font-display text-[clamp(2.8rem,6.5vw,6rem)] leading-[1] tracking-[-0.035em]">
          Discover Indian <em className="italic text-clay">streetwear.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
          TrendXee brings emerging indie labels into focus. Explore graphic and oversized tees, baggy
          jeans, cargos, jackets and accessories, then look closer at the brand behind your next fit.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Cta>
            <a href="#streetwear-lanes" className={ctaClass("primary", "lg")}>
              Discover streetwear <CtaArrow />
            </a>
          </Cta>
          <Link to="/lanes" className={ctaClass("outline", "lg")}>
            Explore all fashion lanes
          </Link>
        </div>
      </header>

      <section id="streetwear-lanes" aria-labelledby="streetwear-lanes-title" className="mt-20 scroll-mt-24">
        <div className="grid gap-5 border-t border-border pt-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow text-clay-ink">Start with a piece</p>
            <h2 id="streetwear-lanes-title" className="mt-3 font-display text-4xl leading-tight tracking-tight">
              Find your silhouette.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-ink/70">
            Begin with the fit you want: a graphic tee, wider denim, relaxed bottoms or a layer. Each
            lane opens the current catalog, where you can compare product details and explore the labels.
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {streetwearLanes.map((lane, index) => {
            return <LaneCard key={lane.id} aesthetic={lane} index={index} products={rotationMap[lane.id]} eager={index < 2} className="h-[min(72svh,520px)]" />;
          })}
        </div>
      </section>

      <section aria-labelledby="streetwear-signals-title" className="mt-20 grid gap-8 rounded-[28px] border border-border bg-raised/60 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow text-clay-ink">Look closer</p>
          <h2 id="streetwear-signals-title" className="mt-3 font-display text-4xl leading-tight tracking-tight">
            Use the hype. Check the details.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            Brand Hype reflects available Instagram signals around a label. Use it as a discovery
            cue, alongside the product details, brand feedback and your own preferences.
          </p>
        </div>
        <ul className="space-y-5 text-base leading-relaxed text-ink/75">
          <li><strong className="font-semibold text-ink">Fit first.</strong> Compare the brand's size chart and garment measurements with a piece you already like.</li>
          <li><strong className="font-semibold text-ink">Look at the fabric.</strong> Read the material and care details, and check the available product photographs.</li>
          <li><strong className="font-semibold text-ink">Know the retailer.</strong> Check delivery charges, payment options and the return policy on the linked store before ordering.</li>
        </ul>
      </section>

      <section aria-labelledby="streetwear-guides-title" className="mt-20">
        <p className="eyebrow text-clay-ink">From the Journal</p>
        <h2 id="streetwear-guides-title" className="mt-3 font-display text-4xl leading-tight tracking-tight">
          Put the pieces together.
        </h2>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {guides.map((guide) => (
            <Link key={guide.slug} to="/journal/$slug" params={{ slug: guide.slug }} search={{ audience: undefined }}
              className="group rounded-[20px] border border-border p-6 transition-colors hover:bg-raised sm:p-8">
              <h3 className="font-display text-2xl leading-snug group-hover:text-clay-ink">
                {guide.title} <span aria-hidden>↗</span>
              </h3>
              <p className="mt-4 text-base leading-relaxed text-ink/70">{guide.description}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink/70">
          TrendXee is a fashion discovery platform. Product links take you to the retailer, which
          handles pricing, availability, delivery and returns.
        </p>
      </section>
    </div>
  );
}
