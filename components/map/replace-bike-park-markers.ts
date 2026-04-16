import type { MutableRefObject } from 'react';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

function buildMarkerIcon(
  pinLogoUrl?: string,
  logoUrl?: string,
): google.maps.Icon | undefined {
  const markerLogoUrl = pinLogoUrl ?? logoUrl;
  if (!markerLogoUrl) return undefined;

  return {
    url: markerLogoUrl,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  };
}

/**
 * Clears existing markers and attaches one Google Maps marker per park.
 * Keeps imperative map work out of the React component.
 */
export function replaceBikeParkMarkersOnMap(
  _map: google.maps.Map,
  markersRef: MutableRefObject<google.maps.Marker[]>,
  parks: readonly BikeParkMapPoint[],
  onMarkerClick: (id: string) => void,
): void {
  markersRef.current.forEach((m) => m.setMap(null));
  markersRef.current = [];

  for (const p of parks) {
    const marker = new google.maps.Marker({
      map: _map,
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      optimized: true,
      icon: buildMarkerIcon(p.pinLogoUrl, p.logoUrl),
    });

    marker.addListener('click', () => {
      onMarkerClick(p.id);
    });

    markersRef.current.push(marker);
  }
}
