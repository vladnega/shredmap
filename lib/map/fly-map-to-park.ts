import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

const FOCUS_ZOOM = 12;

/** Pans the map to a park and zooms in when the current zoom is wider. */
export function flyMapToPark(map: google.maps.Map, park: Pick<BikeParkMapPoint, 'lat' | 'lng'>): void {
  map.panTo({ lat: park.lat, lng: park.lng });
  const currentZoom = map.getZoom();
  if (currentZoom === undefined || currentZoom < FOCUS_ZOOM) {
    map.setZoom(FOCUS_ZOOM);
  }
}
