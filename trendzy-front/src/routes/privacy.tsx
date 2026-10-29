import { pageSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => pageSeo({ title: "Privacy policy — TrendXee", description: "How TrendXee handles account details, analytics, saved products, contact messages and your privacy choices when using our fashion discovery platform.", path: "/privacy" }),
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why, and how external stores you visit from TrendXee are handled."
      sections={[
    {
      id: "contact-messages",
      heading: "Contact messages",
      body: <><p>When you contact TrendXee, we use the email address and message you provide to respond. The message is delivered to our support mailbox. Please do not send passwords or payment details.</p><p>The contact service uses temporary, in-memory request counters to limit abuse. They use a 15-minute window and expired entries are cleared during subsequent requests. The contact handler does not write visitor addresses or message contents to application logs.</p></>,
    },
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
      id: "site-analytics",
      heading: "Site Analytics",
      body: (
        <>
          <p>We use Google Analytics to understand which pages visitors use and how they move through TrendXee. Google Analytics can use cookies and collect information such as page visits, browser and device details, and interactions. We do not send account names, email addresses or passwords to Google Analytics.</p>
          <p>Advertising personalization and Google Signals are disabled in our tag. Our saved analytics opt-out also disables this tag. You can learn more about Google’s collection and controls in <a className="underline underline-offset-4" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google’s information for visitors to partner sites</a>.</p>
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
