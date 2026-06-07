import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

const MAX_RESULTS = 8;

/**
 * Returns parks whose name contains the query (case-insensitive), sorted A→Z.
 * Empty query returns no results (caller shows prompt, not full list).
 */
export function filterParksByName(
  parks: readonly BikeParkMapPoint[],
  query: string,
  limit = MAX_RESULTS,
): BikeParkMapPoint[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return parks
    .filter((park) => park.name.toLowerCase().includes(q))
    .toSorted((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    .slice(0, limit);
}
