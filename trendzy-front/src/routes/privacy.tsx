import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Privacy Policy \u2014 TrendXee" }],
  }),
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why, and how external stores you visit from TrendXee are handled."
      sections={[
    {
      id: "data-collection-privacy",
      heading: "Data Collection & Privacy",
      body: (
        <>
          <p>TrendXee is committed to protecting your privacy. We collect minimal personal information necessary to provide our discovery platform and authentication services.</p>
        </>
      ),
    },
    {
      id: "third-party-websites-and-purchases",
      heading: "Third-Party Websites and Purchases",
      body: (
        <>
          <p>TrendXee may provide links to third-party websites and online stores operated by independent brands or sellers. TrendXee acts as a fashion discovery platform and does not, unless expressly stated otherwise, sell, manufacture, stock, package, ship, deliver, or fulfil the products displayed on the Platform.</p>
          <p>When you follow a product link from TrendXee, you may be redirected to the third-party brand's or seller's own website. Any purchase, payment, delivery, return, refund, warranty, exchange, product quality, product condition, or customer-service matter is governed by the policies and terms of that third party.</p>
          <p>TrendXee does not control the privacy practices, data collection, or other practices of external websites and encourages users to review the privacy policies of those websites before providing personal information.</p>
        </>
      ),
    },
      ]}
    />
  );
}
