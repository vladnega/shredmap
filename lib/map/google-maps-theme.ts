import { importLibrary } from '@googlemaps/js-api-loader';

/** Minimal dark map styling (Google Maps JS). */
const SHREDMAP_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#023e58' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#304a7d' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
];

/** Shared dark map chrome: styled basemap, dark native controls, no Google POI clicks. */
export async function shredmapMapBaseOptions(): Promise<
  Pick<
    google.maps.MapOptions,
    'backgroundColor' | 'clickableIcons' | 'colorScheme' | 'styles'
  >
> {
  const { ColorScheme } = await importLibrary('core');
  return {
    backgroundColor: '#0a0a0a',
    clickableIcons: false,
    colorScheme: ColorScheme.DARK,
    styles: SHREDMAP_MAP_STYLES,
  };
}
