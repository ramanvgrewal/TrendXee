import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/image")({
  server: { handlers: {
    GET: async ({ request }) => (await import("@/server/image-optimizer")).optimizeImage(request),
    HEAD: async ({ request }) => (await import("@/server/image-optimizer")).optimizeImage(request),
  } },
});
