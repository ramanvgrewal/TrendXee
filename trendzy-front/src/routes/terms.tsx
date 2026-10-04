import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [{ title: "Terms of Use \u2014 TrendXee" }],
  }),
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use & Disclaimer"
      intro="How TrendXee works as a discovery platform, and what happens when you follow a link to a brand or store."
      sections={[
    {
      id: "trendxee-as-a-fashion-discovery-platform",
      heading: "TrendXee as a Fashion Discovery Platform",
      body: (
        <>
          <p>TrendXee provides discovery and trend-intelligence services and facilitates access to third-party product listings through external links. The underlying sale and fulfilment of products are conducted by the relevant third-party seller or brand.</p>
          <p>TrendXee is a fashion discovery and trend-intelligence platform. We are not a seller, manufacturer, distributor, retailer, marketplace, or fulfilment provider of the products displayed or referenced on the Platform, unless expressly stated otherwise.</p>
          <p>TrendXee identifies and presents fashion products, brands, styles, and emerging trends based on signals observed from publicly available sources, including social-media activity and other publicly available information. The appearance of a product, brand, or store on TrendXee does not constitute an endorsement, certification, warranty, representation, or guarantee by TrendXee regarding that product, brand, seller, or store.</p>
          <p>TrendXee does not sell or supply the products featured on the Platform. Where a product is displayed with a link to a third-party website or store, that link is provided to enable discovery and direct access to the relevant third-party seller or brand. Any purchase, order, payment, shipping, delivery, return, refund, exchange, warranty, customer service, product quality, authenticity, safety, legality, or other transaction-related matter is solely between you and the relevant third-party seller, brand, or website.</p>
          <p>TrendXee has no control over and does not guarantee the availability, pricing, description, authenticity, quality, condition, packaging, dispatch, delivery time, delivery status, return or refund of any product offered by a third-party seller.</p>
          <p>To the maximum extent permitted by applicable law, TrendXee shall not be responsible or liable for any loss, damage, expense, dispute, delay, non-delivery, defective product, incorrect product, counterfeit product, product-related injury, refund issue, or other consequence arising from a transaction between a user and a third-party seller or website. Nothing in these Terms excludes or limits any liability or rights that cannot lawfully be excluded or limited under applicable law.</p>
          <p>For any issue relating to an order or purchased product, users should contact the relevant seller or brand directly through the third-party store from which the purchase was made.</p>
        </>
      ),
    },
    {
      id: "brand-and-product-representation",
      heading: "Brand and Product Representation",
      body: (
        <>
          <p>TrendXee does not claim ownership of, affiliation with, or authorization from any third-party brand, seller, product, logo, trademark, trade name, image, or other intellectual property displayed or referenced on the Platform, unless expressly stated otherwise.</p>
          <p>The term "underdog brand" or similar terminology used on TrendXee is a descriptive term used by TrendXee to identify independent, emerging, lesser-known, or relatively less-visible brands that may be relevant to our fashion-discovery and trend-identification system. It does not constitute a legal classification, certification, partnership, endorsement, accreditation, or commercial relationship with any such brand.</p>
          <p>The inclusion of a brand or product on TrendXee does not mean that the brand has partnered with, sponsored, authorized, endorsed, or approved TrendXee, unless such relationship is expressly disclosed.</p>
          <p>TrendXee may identify products and brands based on publicly available social-media signals, publicly accessible information, product/store pages, and automated or algorithmic analysis. Such identification is intended for discovery and informational purposes only.</p>
          <p>TrendXee does not represent that any particular product, brand, style, or item will become a trend, go viral, increase in popularity, or achieve any particular level of consumer demand. References to emerging, rising, trending, or similar concepts represent TrendXee's analysis or interpretation of available signals and should not be understood as a guarantee of future popularity or commercial success.</p>
        </>
      ),
    },
    {
      id: "third-party-store-links",
      heading: "Third-Party Store Links",
      body: (
        <>
          <p>TrendXee may provide links to third-party websites, brand websites, online stores, or other external destinations. These links are provided for convenience and product discovery.</p>
          <p>When you select a product on TrendXee, you may be redirected directly to the third-party seller's or brand's own website or store. TrendXee does not process the purchase transaction on behalf of the seller unless expressly stated otherwise.</p>
          <p>Once you leave TrendXee and access a third-party website, your interaction with that website is governed by the third party's own terms, privacy policy, return policy, refund policy, shipping policy, warranty terms, and other applicable policies.</p>
          <p>TrendXee is not responsible for the content, operation, security, availability, performance, or practices of third-party websites.</p>
        </>
      ),
    },
      ]}
    />
  );
}
