/**
 * Loads per-park counts of mates riding on a calendar day (for map markers).
 */
export async function fetchMatesOnMapCounts(
  rideDay: string,
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const res = await fetch(
    `/api/ride-plans/mates-on-map?date=${encodeURIComponent(rideDay)}`,
    { signal },
  );
  if (!res.ok) {
    throw new Error(`mates-on-map ${res.status}`);
  }
  const data = (await res.json()) as { counts?: Record<string, number> };
  return data.counts ?? {};
}
