import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MotionProvider } from "@/motion/MotionProvider";
import { ctaClass } from "@/components/Cta";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-[1440px] flex-col justify-center px-5 py-24 sm:px-8">
      <p className="hand text-xl text-clay">this page slipped off the board</p>
      <h1 className="mt-3 font-display text-[clamp(5rem,16vw,13rem)] leading-[0.85] tracking-[-0.05em]">
        4<em className="italic text-clay">0</em>4
      </h1>
      <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink/65">
        The page you're looking for doesn't exist or has moved. The lanes are still here, though.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link to="/" className={ctaClass("primary", "lg")}>
          Back to the board
        </Link>
        <Link to="/lanes" className={ctaClass("outline", "lg")}>
          Browse lanes
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const reportableError = error instanceof Error ? error : new Error(String(error));
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(reportableError, { boundary: "tanstack_root_error_component" });
  }, [reportableError]);

  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-[1440px] flex-col justify-center px-5 py-24 sm:px-8">
      <p className="hand text-xl text-clay">something came unpinned</p>
      <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-[1] tracking-[-0.03em]">
        This page didn't load.
      </h1>
      <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink/65">
        It's on our side, not yours. Try again, or head back to the board.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className={ctaClass("primary", "lg")}
        >
          Try again
        </button>
        <a href="/" className={ctaClass("outline", "lg")}>
          Back to the board
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TrendXee — fits before they go viral" },
      {
        name: "description",
        content:
          "A hand-pinned board of aesthetic lanes, scored by the signals gathering behind each fit.",
      },
      { property: "og:title", content: "TrendXee — fits before they go viral" },
      {
        property: "og:description",
        content:
          "A hand-pinned board of aesthetic lanes, scored by the signals gathering behind each fit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Nunito+Sans:wght@400;600;700;800&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/logo.png?v=2" },
      { rel: "shortcut icon", type: "image/png", href: "/logo.png?v=2" },
      { rel: "apple-touch-icon", href: "/logo.png?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Set the saved theme before first paint so the board never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('trendxee-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "TrendXee",
              alternateName: ["Trendxee", "TrendXee AI"],
              url: "https://trendxee.com/"
            })
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Handle back/forward cache (bfcache) restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.invalidate();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Mounted once at the root so the cursor and pointer state persist across routes. */}
      <MotionProvider>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
        <Toaster />
      </MotionProvider>
    </QueryClientProvider>
  );
}
