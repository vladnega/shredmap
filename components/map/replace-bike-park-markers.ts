import type { MutableRefObject } from 'react';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import {
  createCircleBikeParkMarker,
  detachMapMarker,
  type CircleBikeParkMarker,
} from '@/lib/map/advanced-markers';

const MARKER_ICON_SIZE = 40;

/**
 * Round logo “pin” built from DOM (CSS clip). Works for cross-origin images where
 * canvas `toDataURL` would taint and fail — unlike bitmap Marker icons.
 */
function createRoundLogoRoot(logoUrl: string, mates: number, title: string): HTMLDivElement {
  const root = document.createElement('div');
  root.style.position = 'relative';
  root.style.width = `${MARKER_ICON_SIZE}px`;
  root.style.height = `${MARKER_ICON_SIZE}px`;
  root.style.cursor = 'pointer';
  root.style.touchAction = 'manipulation';
  root.style.transition = 'transform 150ms ease, filter 150ms ease';
  root.title = title;
  root.setAttribute('role', 'button');
  root.tabIndex = 0;
  if (mates > 0) root.style.zIndex = '900';

  const disc = document.createElement('div');
  disc.style.width = '100%';
  disc.style.height = '100%';
  disc.style.borderRadius = '50%';
  disc.style.overflow = 'hidden';
  disc.style.boxSizing = 'border-box';
  disc.style.border = '2px solid rgba(255, 255, 255, 0.45)';
  disc.style.backgroundColor = '#0f172a';

  const img = document.createElement('img');
  img.src = logoUrl;
  img.alt = '';
  img.draggable = false;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';

  disc.appendChild(img);
  root.appendChild(disc);

  if (mates > 0) {
    const badge = document.createElement('div');
    badge.textContent = String(mates);
    badge.style.position = 'absolute';
    badge.style.right = '-2px';
    badge.style.top = '-2px';
    badge.style.minWidth = '18px';
    badge.style.height = '18px';
    badge.style.borderRadius = '9px';
    badge.style.background = '#ea580c';
    badge.style.color = '#fff';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = 'bold';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.padding = '0 4px';
    badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4)';
    badge.style.pointerEvents = 'none';
    root.appendChild(badge);
  }

  return root;
}

type LogoOverlayConstructor = new (
  latLng: google.maps.LatLngLiteral,
  logoUrl: string,
  mates: number,
  title: string,
  onClick: () => void,
) => google.maps.OverlayView & { setHighlighted: (highlight: boolean) => void };

/** Defined on first use so this module can load before `importLibrary('maps')` sets `google`. */
let bikeParkLogoOverlayClass: LogoOverlayConstructor | undefined;

function getBikeParkLogoOverlayClass(): LogoOverlayConstructor {
  if (!bikeParkLogoOverlayClass) {
    bikeParkLogoOverlayClass = class BikeParkLogoOverlay extends google.maps.OverlayView {
      private readonly root: HTMLDivElement;
      private readonly matesCount: number;
      private highlighted = false;

      constructor(
        private readonly latLng: google.maps.LatLngLiteral,
        logoUrl: string,
        mates: number,
        title: string,
        onClick: () => void,
      ) {
        super();
        this.matesCount = mates;
        this.root = createRoundLogoRoot(logoUrl, mates, title);
        const handler = (e: Event) => {
          e.stopPropagation();
          onClick();
        };
        this.root.addEventListener('click', handler);
        this.root.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        });
      }

      setHighlighted(highlight: boolean): void {
        this.highlighted = highlight;
        if (highlight) {
          this.root.style.transform = 'scale(1.25)';
          this.root.style.filter =
            'drop-shadow(0 0 6px rgba(249, 115, 22, 0.95)) drop-shadow(0 0 14px rgba(234, 88, 12, 0.75))';
          this.root.style.zIndex = '1000';
        } else {
          this.root.style.transform = '';
          this.root.style.filter = '';
          this.root.style.zIndex = this.matesCount > 0 ? '900' : '';
        }
      }

      onAdd(): void {
        const panes = this.getPanes();
        if (!panes?.overlayMouseTarget) return;
        this.root.style.position = 'absolute';
        panes.overlayMouseTarget.appendChild(this.root);
      }

      draw(): void {
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.latLng.lat, this.latLng.lng),
        );
        if (!point) return;
        const o = MARKER_ICON_SIZE / 2;
        const scale = this.highlighted ? 1.25 : 1;
        const offset = (MARKER_ICON_SIZE * scale) / 2;
        this.root.style.left = `${point.x - offset}px`;
        this.root.style.top = `${point.y - offset}px`;
      }

      onRemove(): void {
        this.root.remove();
      }
    };
  }
  return bikeParkLogoOverlayClass;
}

export type BikeParkMapMarker = CircleBikeParkMarker | google.maps.OverlayView;

export type BikeParkMarkerRegistry = {
  markers: BikeParkMapMarker[];
  byParkId: Map<string, BikeParkMapMarker>;
  highlightedParkId: string | null;
};

export function createEmptyBikeParkMarkerRegistry(): BikeParkMarkerRegistry {
  return {
    markers: [],
    byParkId: new Map(),
    highlightedParkId: null,
  };
}

/**
 * Clears existing markers and attaches one Google Maps marker per park.
 * Keeps imperative map work out of the React component.
 */
export async function replaceBikeParkMarkersOnMap(
  map: google.maps.Map,
  registryRef: MutableRefObject<BikeParkMarkerRegistry>,
  parks: readonly BikeParkMapPoint[],
  onMarkerClick: (id: string) => void,
): Promise<void> {
  registryRef.current.markers.forEach(detachMapMarker);

  const registry: BikeParkMarkerRegistry = {
    markers: [],
    byParkId: new Map(),
    highlightedParkId: null,
  };

  for (const p of parks) {
    const mates = p.matesRidingCount ?? 0;
    const hasMates = mates > 0;
    const logoUrl = p.pinLogoUrl ?? p.logoUrl;
    const title =
      hasMates ? `${p.name} — ${mates} mate${mates === 1 ? '' : 's'} riding` : p.name;

    if (logoUrl) {
      const OverlayClass = getBikeParkLogoOverlayClass();
      const overlay = new OverlayClass(
        { lat: p.lat, lng: p.lng },
        logoUrl,
        mates,
        title,
        () => {
          onMarkerClick(p.id);
        },
      );
      overlay.setMap(map);
      registry.markers.push(overlay);
      registry.byParkId.set(p.id, overlay);
      continue;
    }

    const marker = await createCircleBikeParkMarker(
      map,
      { lat: p.lat, lng: p.lng },
      mates,
      title,
      () => {
        onMarkerClick(p.id);
      },
    );

    registry.markers.push(marker);
    registry.byParkId.set(p.id, marker);
  }

  registryRef.current = registry;
}
