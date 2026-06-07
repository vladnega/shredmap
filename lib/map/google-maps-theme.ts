import { importLibrary } from '@googlemaps/js-api-loader';

/** Map ID for Advanced Markers. Use a Cloud Console map ID in production (with dark styling there). */
export function shredmapGoogleMapsMapId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  return fromEnv || 'DEMO_MAP_ID';
}

/** Shared dark map chrome: map ID (cloud styling), dark native controls, no Google POI clicks. */
export async function shredmapMapBaseOptions(): Promise<
  Pick<
    google.maps.MapOptions,
    'backgroundColor' | 'clickableIcons' | 'colorScheme' | 'mapId'
  >
> {
  const { ColorScheme } = await importLibrary('core');
  return {
    mapId: shredmapGoogleMapsMapId(),
    backgroundColor: '#0a0a0a',
    clickableIcons: false,
    colorScheme: ColorScheme.DARK,
  };
}
