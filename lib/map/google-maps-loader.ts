import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let configuredApiKey: string | null = null;
let markerLibrary: google.maps.MarkerLibrary | null = null;

/** Call before any `importLibrary` usage. Resets cached libraries when the key changes. */
export function configureGoogleMapsApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) return;
  if (configuredApiKey === trimmed) return;
  configuredApiKey = trimmed;
  markerLibrary = null;
  setOptions({ key: trimmed, v: 'weekly' });
}

export async function loadGoogleMapsLibrary(): Promise<void> {
  await importLibrary('maps');
}

export async function ensureMarkerLibraryLoaded(): Promise<google.maps.MarkerLibrary> {
  if (!markerLibrary) {
    markerLibrary = await importLibrary('marker');
  }
  return markerLibrary;
}
