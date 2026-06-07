import type {
  BikeParkMapMarker,
  BikeParkMarkerRegistry,
} from '@/components/map/replace-bike-park-markers';
import { setCircleMarkerSearchHighlight } from '@/lib/map/advanced-markers';
import { ensureMarkerLibraryLoaded } from '@/lib/map/google-maps-loader';

function isHighlightableOverlay(
  marker: BikeParkMapMarker,
): marker is google.maps.OverlayView & { setHighlighted: (highlight: boolean) => void } {
  return 'setHighlighted' in marker && typeof marker.setHighlighted === 'function';
}

async function setMarkerHighlighted(marker: BikeParkMapMarker, highlight: boolean): Promise<void> {
  const { AdvancedMarkerElement } = await ensureMarkerLibraryLoaded();
  if (marker instanceof AdvancedMarkerElement) {
    setCircleMarkerSearchHighlight(marker, highlight);
    return;
  }

  if (isHighlightableOverlay(marker)) {
    marker.setHighlighted(highlight);
  }
}

/** Clears any previous highlight and applies it to the given park marker. */
export async function highlightBikeParkMarker(
  registry: BikeParkMarkerRegistry,
  parkId: string | null,
): Promise<void> {
  if (registry.highlightedParkId && registry.highlightedParkId !== parkId) {
    const previous = registry.byParkId.get(registry.highlightedParkId);
    if (previous) await setMarkerHighlighted(previous, false);
  }

  registry.highlightedParkId = parkId;

  if (!parkId) return;

  const marker = registry.byParkId.get(parkId);
  if (marker) await setMarkerHighlighted(marker, true);
}

/** Clears highlight state without changing which marker is selected in React. */
export async function clearBikeParkMarkerHighlight(
  registry: BikeParkMarkerRegistry,
): Promise<void> {
  await highlightBikeParkMarker(registry, null);
}
