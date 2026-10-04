import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading a route's data when a link is hovered or focused, so the
    // page (and any transition into it) is ready by the time it's clicked.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    // Routes opt into longer caching via their own `staleTime`.
    defaultStaleTime: 0,
  });

  return router;
};
