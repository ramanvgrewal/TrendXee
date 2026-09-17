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

let statusCircuitBreaker = false;

export const getArchiveStatus = async (trendId: string) => {
  if (statusCircuitBreaker) return false;
  
  try {
    const res = await apiFetch(`/api/v2/archive/trends/${trendId}/status`, {
      method: 'GET',
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        statusCircuitBreaker = true; // Stop asking if unauthorized
      }
      return false;
    }
    return await res.json();
  } catch (err) {
    // If it's a network error (like CORS or offline), trip the breaker so we don't spam the console 100 times
    statusCircuitBreaker = true;
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
  return res.json();
};
