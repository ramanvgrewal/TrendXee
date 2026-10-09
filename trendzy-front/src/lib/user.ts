import { queryOptions } from "@tanstack/react-query";
import { businessApiFetch } from "@/lib/api";

export type CurrentUser = {
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
};

/**
 * The single definition of the signed-in user query. Every component that
 * needs the user uses this, so the fetcher is always present no matter which
 * component mounts first.
 */
export const currentUserQuery = queryOptions({
  queryKey: ["currentUser"],
  queryFn: async (): Promise<CurrentUser> => {
    const res = await businessApiFetch("/api/users/me");
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },
  retry: false,
  staleTime: 5 * 60_000,
});
