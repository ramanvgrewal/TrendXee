import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: 'Privacy Policy — TrendXee' }],
  }),
});

function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl mb-8">Privacy Policy</h1>
      
      <div className="space-y-8 text-ink/80 leading-relaxed">
        <section>
          <h3 className="text-xl font-bold text-ink mb-4">Data Collection & Privacy</h3>
          <div className="space-y-4">
            <p>
              TrendXee is committed to protecting your privacy. We collect minimal personal information necessary to provide our discovery platform and authentication services.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-ink mb-4">Third-Party Websites and Purchases</h3>
          <div className="space-y-4">
            <p>
              TrendXee may provide links to third-party websites and online stores operated by independent brands or sellers. TrendXee acts as a fashion discovery platform and does not, unless expressly stated otherwise, sell, manufacture, stock, package, ship, deliver, or fulfil the products displayed on the Platform.
            </p>
            <p>
              When you follow a product link from TrendXee, you may be redirected to the third-party brand's or seller's own website. Any purchase, payment, delivery, return, refund, warranty, exchange, product quality, product condition, or customer-service matter is governed by the policies and terms of that third party.
            </p>
            <p>
              TrendXee does not control the privacy practices, data collection, or other practices of external websites and encourages users to review the privacy policies of those websites before providing personal information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
