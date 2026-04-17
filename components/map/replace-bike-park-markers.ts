import type { MutableRefObject } from 'react';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

const MARKER_ICON_SIZE = 40;

function defaultOrangeCircle(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#f97316',
    fillOpacity: 0.95,
    strokeColor: '#ffedd5',
    strokeWeight: 2,
    scale: 12,
  };
}

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
) => google.maps.OverlayView;

/** Defined on first use so this module can load before `importLibrary('maps')` sets `google`. */
let bikeParkLogoOverlayClass: LogoOverlayConstructor | undefined;

function getBikeParkLogoOverlayClass(): LogoOverlayConstructor {
  if (!bikeParkLogoOverlayClass) {
    bikeParkLogoOverlayClass = class BikeParkLogoOverlay extends google.maps.OverlayView {
      private readonly root: HTMLDivElement;

      constructor(
        private readonly latLng: google.maps.LatLngLiteral,
        logoUrl: string,
        mates: number,
        title: string,
        onClick: () => void,
      ) {
        super();
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
        this.root.style.left = `${point.x - o}px`;
        this.root.style.top = `${point.y - o}px`;
      }

      onRemove(): void {
        this.root.remove();
      }
    };
  }
  return bikeParkLogoOverlayClass;
}

export type BikeParkMapMarker = google.maps.Marker | google.maps.OverlayView;

/**
 * Clears existing markers and attaches one Google Maps marker per park.
 * Keeps imperative map work out of the React component.
 */
export function replaceBikeParkMarkersOnMap(
  map: google.maps.Map,
  markersRef: MutableRefObject<BikeParkMapMarker[]>,
  parks: readonly BikeParkMapPoint[],
  onMarkerClick: (id: string) => void,
): void {
  markersRef.current.forEach((m) => {
    m.setMap(null);
  });
  markersRef.current = [];

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
      markersRef.current.push(overlay);
      continue;
    }

    const marker = new google.maps.Marker({
      map,
      position: { lat: p.lat, lng: p.lng },
      title,
      optimized: true,
      icon: defaultOrangeCircle(),
      label: hasMates
        ? {
            text: String(mates),
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
          }
        : undefined,
      zIndex: hasMates ? 900 : undefined,
    });

    marker.addListener('click', () => {
      onMarkerClick(p.id);
    });

    markersRef.current.push(marker);
  }
}
