import { ensureMarkerLibraryLoaded } from '@/lib/map/google-maps-loader';

export type CircleBikeParkMarker = google.maps.marker.AdvancedMarkerElement;

const CIRCLE_MARKER_SIZE = 24;
const CIRCLE_MARKER_SIZE_HIGHLIGHT = 32;

const circleMarkerMeta = new WeakMap<CircleBikeParkMarker, { mates: number }>();

export async function isCircleAdvancedMarker(
  marker: google.maps.OverlayView | CircleBikeParkMarker,
): Promise<boolean> {
  const { AdvancedMarkerElement } = await ensureMarkerLibraryLoaded();
  return marker instanceof AdvancedMarkerElement;
}

/** Orange circle DOM — matches legacy SymbolPath.CIRCLE markers, avoids PinElement API churn. */
function createCircleMarkerContent(mates: number, highlight: boolean): HTMLDivElement {
  const size = highlight ? CIRCLE_MARKER_SIZE_HIGHLIGHT : CIRCLE_MARKER_SIZE;
  const root = document.createElement('div');
  root.style.width = `${size}px`;
  root.style.height = `${size}px`;
  root.style.borderRadius = '50%';
  root.style.boxSizing = 'border-box';
  root.style.backgroundColor = highlight ? '#fb923c' : '#f97316';
  root.style.border = `2px solid ${highlight ? '#fff7ed' : '#ffedd5'}`;
  root.style.opacity = highlight ? '1' : '0.95';
  root.style.position = 'relative';
  root.style.cursor = 'pointer';
  root.style.touchAction = 'manipulation';
  root.classList.toggle('shredmap-marker-bounce', highlight);

  if (mates > 0) {
    const label = document.createElement('span');
    label.textContent = String(mates);
    label.style.position = 'absolute';
    label.style.inset = '0';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    label.style.color = '#ffffff';
    label.style.fontSize = '11px';
    label.style.fontWeight = 'bold';
    label.style.pointerEvents = 'none';
    root.appendChild(label);
  }

  return root;
}

export async function createCircleBikeParkMarker(
  map: google.maps.Map,
  position: google.maps.LatLngLiteral,
  mates: number,
  title: string,
  onClick: () => void,
): Promise<CircleBikeParkMarker> {
  const { AdvancedMarkerElement } = await ensureMarkerLibraryLoaded();
  const content = createCircleMarkerContent(mates, false);
  const marker = new AdvancedMarkerElement({
    map,
    position,
    title,
    content,
    zIndex: mates > 0 ? 900 : undefined,
  });
  circleMarkerMeta.set(marker, { mates });
  marker.addListener('click', onClick);
  return marker;
}

/** Updates circle markers to a larger highlighted icon when search selects a park. */
export function setCircleMarkerSearchHighlight(
  marker: CircleBikeParkMarker,
  highlight: boolean,
): void {
  const mates = circleMarkerMeta.get(marker)?.mates ?? 0;
  marker.content = createCircleMarkerContent(mates, highlight);
  marker.zIndex = highlight ? 1000 : mates > 0 ? 900 : undefined;
}

export function detachMapMarker(
  marker: google.maps.OverlayView | CircleBikeParkMarker,
): void {
  if (marker instanceof google.maps.OverlayView) {
    marker.setMap(null);
    return;
  }
  marker.map = null;
}

/** Default orange location pin for admin picker (no logo). */
export function createLocationPickerPinElement(): HTMLDivElement {
  const root = document.createElement('div');
  root.style.width = '24px';
  root.style.height = '24px';
  root.style.borderRadius = '50%';
  root.style.boxSizing = 'border-box';
  root.style.backgroundColor = '#f97316';
  root.style.border = '2px solid #ffedd5';
  root.style.boxShadow = '0 1px 3px rgba(0,0,0,0.35)';
  return root;
}
