import type { MutableRefObject } from 'react';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

type ReplaceBikeParkMarkersOptions = {
  /** Used when panning/zooming after a marker tap on small viewports. */
  isDesktop: () => boolean;
  /** Minimum zoom after selecting a park on mobile (inclusive). */
  mobileSelectMinZoom: number;
  /** Fallback if `map.getZoom()` is undefined. */
  mapFallbackZoom: number;
};

/**
 * Clears existing markers and attaches one Google Maps marker per park.
 * Keeps imperative map work out of the React component.
 */
export function replaceBikeParkMarkersOnMap(
  map: google.maps.Map,
  markersRef: MutableRefObject<google.maps.Marker[]>,
  parks: readonly BikeParkMapPoint[],
  onMarkerClick: (id: string) => void,
  options: ReplaceBikeParkMarkersOptions,
): void {
  markersRef.current.forEach((m) => m.setMap(null));
  markersRef.current = [];

  for (const p of parks) {
    const marker = new google.maps.Marker({
      map,
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      optimized: true,
    });

    marker.addListener('click', () => {
      onMarkerClick(p.id);
      map.panTo({ lat: p.lat, lng: p.lng });
      if (!options.isDesktop()) {
        map.setZoom(
          Math.max(
            map.getZoom() ?? options.mapFallbackZoom,
            options.mobileSelectMinZoom,
          ),
        );
      }
    });

    markersRef.current.push(marker);
  }
}
