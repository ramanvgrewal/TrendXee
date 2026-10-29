import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  archiveTrend,
  deleteTrendPermanently,
  getArchiveStatus,
  unarchiveTrend,
  updateTrendPrice,
  updateTrendScore,
} from "@/lib/archiveApi";
import { businessApiFetch } from "@/lib/api";
import { currentUserQuery } from "@/lib/user";
import type { Trend } from "@/lib/mock-data";

export function useSession() {
  const { data: user } = useQuery(currentUserQuery);
  return {
    user,
    isSignedIn: !!user,
    isAdmin: user?.role === "ADMIN" || user?.email === "ramanvgrewal@gmail.com",
  };
}

/**
 * Whether a trend is in the signed-in user's archive. One cached request per
 * trend (shared by the card and its open story), and none at all when
 * signed out — the old card fired a status request for every card on the page.
 */
export function useArchiveStatus(trendId: string, knownArchived = false) {
  const { isSignedIn } = useSession();
  const query = useQuery({
    queryKey: ["archiveStatus", trendId],
    queryFn: () => getArchiveStatus(trendId) as Promise<boolean>,
    enabled: isSignedIn && !knownArchived,
    staleTime: 5 * 60_000,
  });
  return knownArchived || query.data === true;
}

export function useToggleArchive(trendId: string, onUnarchived?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archived: boolean) => {
      if (archived) await unarchiveTrend(trendId);
      else await archiveTrend(trendId);
      return !archived;
    },
    onSuccess: (nowArchived) => {
      queryClient.setQueryData(["archiveStatus", trendId], nowArchived);
      if (nowArchived) {
        toast.success("Pinned to your archive");
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('trendxee:outfit-action', { detail: { trendId, type: 'SAVE' } }));
      }
      else {
        toast("Removed from your archive");
        onUnarchived?.();
      }
    },
    onError: () => toast.error("That didn't save. Please try again."),
  });
}

export function trackProductClick(trendId: string, source: "underdog" | "amazon" | "flipkart", url: string) {
  if (source === 'underdog' && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('trendxee:outfit-action', { detail: { trendId, type: 'SHOP_CLICK' } }));
  businessApiFetch("/api/analytics/click", {
    method: "POST",
    body: JSON.stringify({ trendId, source, url }),
    keepalive: true,
  }).catch(() => {});
}

export const adminActions = {
  score: (id: string, score: number) => updateTrendScore(id, score) as Promise<Trend>,
  price: (id: string, price: number) => updateTrendPrice(id, price) as Promise<Trend>,
  remove: (id: string) => deleteTrendPermanently(id),
};
