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

export const getArchiveStatus = async (trendId: string) => {
  const res = await apiFetch(`/api/v2/archive/trends/${trendId}/status`, {
    method: 'GET',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch archive status');
  }
  return res.json();
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
