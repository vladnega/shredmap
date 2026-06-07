import {
  setCircleMarkerSearchHighlight,
  type BikeParkMapMarker,
  type BikeParkMarkerRegistry,
} from '@/components/map/replace-bike-park-markers';

function isGoogleMarker(marker: BikeParkMapMarker): marker is google.maps.Marker {
  return marker instanceof google.maps.Marker;
}

function isHighlightableOverlay(
  marker: BikeParkMapMarker,
): marker is google.maps.OverlayView & { setHighlighted: (highlight: boolean) => void } {
  return 'setHighlighted' in marker && typeof marker.setHighlighted === 'function';
}

function setMarkerHighlighted(marker: BikeParkMapMarker, highlight: boolean): void {
  if (isGoogleMarker(marker)) {
    setCircleMarkerSearchHighlight(marker, highlight);
    return;
  }

  if (isHighlightableOverlay(marker)) {
    marker.setHighlighted(highlight);
  }
}

/** Clears any previous highlight and applies it to the given park marker. */
export function highlightBikeParkMarker(
  registry: BikeParkMarkerRegistry,
  parkId: string | null,
): void {
  if (registry.highlightedParkId && registry.highlightedParkId !== parkId) {
    const previous = registry.byParkId.get(registry.highlightedParkId);
    if (previous) setMarkerHighlighted(previous, false);
  }

  registry.highlightedParkId = parkId;

  if (!parkId) return;

  const marker = registry.byParkId.get(parkId);
  if (marker) setMarkerHighlighted(marker, true);
}

/** Clears highlight state without changing which marker is selected in React. */
export function clearBikeParkMarkerHighlight(registry: BikeParkMarkerRegistry): void {
  highlightBikeParkMarker(registry, null);
}
