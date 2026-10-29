/** Public GA4 measurement ID. The root document owns this tag on every route. */
export const GOOGLE_ANALYTICS_ID = "G-6RWGTJR8LM";

// GA4 Enhanced Measurement tracks History API navigation. Keep one config call:
// adding a second router page_view emitter would double-count those navigations.
export const googleAnalyticsBootstrap = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
try {
  window['ga-disable-${GOOGLE_ANALYTICS_ID}'] =
    !['trendxee.com', 'www.trendxee.com'].includes(window.location.hostname) ||
    window.localStorage.getItem('trendxee:analytics') === 'off';
} catch (e) {
  window['ga-disable-${GOOGLE_ANALYTICS_ID}'] = true;
}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
`;
