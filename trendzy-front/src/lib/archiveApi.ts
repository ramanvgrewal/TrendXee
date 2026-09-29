import { apiFetch, normalizeTrend } from "@/lib/api";

export const archiveTrend = async (trendId: string) => {
  const res = await apiFetch(`/api/v2/archive/trends/${trendId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to archive trend');
  }
  return res.json();
};

export const unarchiveTrend = async (trendId: string) => {
  const res = await apiFetch(`/api/v2/archive/trends/${trendId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to unarchive trend');
  }
};

export const getArchivedTrends = async () => {
  const res = await apiFetch(`/api/v2/archive/trends`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch archived trends');
  }
  const archivedTrends = await res.json();
  return archivedTrends.map((item: any) => ({
    ...item,
    trendSnapshot: normalizeTrend(item.trendSnapshot),
  }));
};

// Circuit breaker: tracks auth failures only (401/403), not transient network errors.
// Resets after 60 seconds to recover from temporary outages.
let authFailedAt: number | null = null;
const AUTH_BREAKER_COOLDOWN_MS = 60_000;

export const getArchiveStatus = async (trendId: string) => {
  // Only trip breaker on confirmed auth failures, and auto-reset after cooldown
  if (authFailedAt !== null && Date.now() - authFailedAt < AUTH_BREAKER_COOLDOWN_MS) {
    return false;
  }

  try {
    const res = await apiFetch(`/api/v2/archive/trends/${trendId}/status`, {
      method: 'GET',
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        authFailedAt = Date.now(); // Trip breaker only on auth failures
      }
      return false;
    }
    authFailedAt = null; // Reset breaker on success
    return await res.json();
  } catch (err) {
    // Network error — do NOT trip the breaker, just return false for this call
    return false;
  }
};

export const deleteTrendPermanently = async (trendId: string) => {
  const res = await apiFetch(`/api/v2/trends/${trendId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete trend permanently');
  }
  // Endpoint returns 204 No Content — there is no body to parse
};

export const updateTrendPrice = async (trendId: string, price: number) => {
  const res = await apiFetch(`/api/v2/trends/${trendId}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ price }),
  });
  if (!res.ok) {
    throw new Error('Failed to update trend price');
  }
  return res.json();
};
