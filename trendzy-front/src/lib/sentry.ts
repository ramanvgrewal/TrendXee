import * as Sentry from "@sentry/react";

// Public client key: safe to ship in the browser bundle.
const DEFAULT_DSN =
  "https://299db7503c114ec6adc4eddbde2a8b31@o4512484830609408.ingest.us.sentry.io/4512484978851840";

let started = false;

/** Starts browser error monitoring once, in production builds only. */
export function initSentry() {
  if (started || typeof window === "undefined" || !import.meta.env.PROD) return;
  started = true;
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || DEFAULT_DSN,
    environment: "production",
    tracesSampleRate: 0,
  });
}
