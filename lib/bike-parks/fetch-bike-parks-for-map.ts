export type BikeParkMapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  logoUrl?: string;
  pinLogoUrl?: string;
};

export type FetchBikeParksForMapResult =
  | { status: 'ok'; parks: BikeParkMapPoint[] }
  | { status: 'aborted' }
  | { status: 'error'; message: string };

function parseBikeParksListResponse(
  parsed: unknown,
): { ok: true; parks: BikeParkMapPoint[] } | { ok: false; error: string } {
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { parks?: unknown }).parks)
  ) {
    return {
      ok: false,
      error: 'Received an unexpected response from the server.',
    };
  }

  const data = parsed as { parks: Array<Record<string, unknown>> };
  const parks: BikeParkMapPoint[] = [];

  for (const p of data.parks) {
    const id = String(p.id);
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const logoUrl =
      typeof p.logoUrl === 'string' && p.logoUrl.trim().length > 0
        ? p.logoUrl.trim()
        : undefined;
    const pinLogoUrl =
      typeof p.pinLogoUrl === 'string' && p.pinLogoUrl.trim().length > 0
        ? p.pinLogoUrl.trim()
        : undefined;

    parks.push({ id, name: String(p.name), lat, lng, logoUrl, pinLogoUrl });
  }

  return { ok: true, parks };
}

/**
 * Fetches `/api/bike-parks` and returns normalized points for map markers.
 * Handles abort without surfacing an error (caller should no-op).
 */
export async function fetchBikeParksForMap(
  signal?: AbortSignal,
): Promise<FetchBikeParksForMapResult> {
  try {
    const res = await fetch('/api/bike-parks', { signal });
    if (signal?.aborted) return { status: 'aborted' };

    if (!res.ok) {
      return {
        status: 'error',
        message: `Could not load bike parks (HTTP ${res.status}). Please try again.`,
      };
    }

    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return {
        status: 'error',
        message: 'The server returned data that could not be read.',
      };
    }

    if (signal?.aborted) return { status: 'aborted' };

    const list = parseBikeParksListResponse(parsed);
    if (!list.ok) {
      return { status: 'error', message: list.error };
    }

    return { status: 'ok', parks: list.parks };
  } catch (err) {
    if (
      signal?.aborted ||
      (err instanceof DOMException && err.name === 'AbortError')
    ) {
      return { status: 'aborted' };
    }

    const message =
      err instanceof TypeError
        ? 'Network error. Check your connection and try again.'
        : err instanceof Error
          ? err.message
          : 'Could not load bike parks.';

    return { status: 'error', message };
  }
}
