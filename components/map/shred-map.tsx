'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { BikePark } from '@/lib/db/schema';
import { fetchBikeParksForMap } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import { replaceBikeParkMarkersOnMap } from '@/components/map/replace-bike-park-markers';
import { ParkDetailPanel } from '@/components/map/park-detail-panel';
import { MapChrome } from '@/components/map/map-chrome';
import { Button } from '@/components/ui/button';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';

const UK_CENTER = { lat: 54.2, lng: -2.5 };
const DEFAULT_ZOOM = 6;
/** Minimum zoom when selecting a park from a marker on narrow viewports. */
const MOBILE_MARKER_SELECT_MIN_ZOOM = 11;

/** Minimal dark map styling (Google Maps JS). */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
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

export function ShredMap({
  googleMapsApiKey,
}: {
  googleMapsApiKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [parksError, setParksError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BikePark | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [desktop, setDesktop] = useState(true);

  const desktopRef = useRef(desktop);
  desktopRef.current = desktop;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setDesktop(mq.matches);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setDetailLoading(true);

    void (async () => {
      try {
        const res = await fetch(`/api/bike-parks/${selectedId}`, { signal });
        if (!res.ok) {
          if (!signal.aborted) {
            setDetail(null);
          }
          return;
        }
        const park = (await res.json()) as BikePark;
        if (!signal.aborted) {
          setDetail(park);
        }
      } catch {
        if (!signal.aborted) {
          setDetail(null);
        }
      } finally {
        if (!signal.aborted) {
          setDetailLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [selectedId]);

  const loadBikeParkMarkers = useCallback(async (signal?: AbortSignal) => {
    if (!mapRef.current) return;

    setParksError(null);

    const result = await fetchBikeParksForMap(signal);

    if (result.status === 'aborted' || signal?.aborted || !mapRef.current) {
      return;
    }

    if (result.status === 'error') {
      setParksError(result.message);
      return;
    }

    const map = mapRef.current;
    replaceBikeParkMarkersOnMap(
      map,
      markersRef,
      result.parks,
      setSelectedId,
      {
        isDesktop: () => desktopRef.current,
        mobileSelectMinZoom: MOBILE_MARKER_SELECT_MIN_ZOOM,
        mapFallbackZoom: DEFAULT_ZOOM,
      },
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current || !googleMapsApiKey) return;

    let cancelled = false;
    const ac = new AbortController();

    void (async () => {
      setOptions({
        key: googleMapsApiKey,
        v: 'weekly',
      });
      await importLibrary('maps');
      if (cancelled || !containerRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: UK_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: MAP_STYLES,
        backgroundColor: '#0a0a0a',
      });
      mapRef.current = map;
      setMapReady(true);

      await loadBikeParkMarkers(ac.signal);
    })();

    return () => {
      cancelled = true;
      ac.abort();
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [googleMapsApiKey, loadBikeParkMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    window.setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 320);
  }, [mapReady, desktop, selectedId]);

  const closePanel = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-zinc-950">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        role="application"
        aria-label="Map of UK mountain bike parks"
      />

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-400">Loading map…</p>
          </div>
        </div>
      )}

      {parksError && (
        <div
          role="alert"
          className="pointer-events-auto fixed bottom-6 left-1/2 flex max-w-md -translate-x-1/2 flex-col gap-3 rounded-lg border border-red-500/35 bg-zinc-950/95 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-8"
          style={{ zIndex: MAP_UI_LAYER_Z.mapErrorToast }}
        >
          <p className="text-sm text-red-100/95">{parksError}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start border border-zinc-600 bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={() => void loadBikeParkMarkers()}
          >
            Try again
          </Button>
        </div>
      )}

      <MapChrome />

      {selectedId && desktop && (
        <div
          className="pointer-events-auto absolute bottom-0 right-0 top-0 flex max-w-[min(100vw,28rem)]"
          style={{ zIndex: MAP_UI_LAYER_Z.desktopParkPanel }}
        >
          {detailLoading && !detail ? (
            <div className="flex w-full min-w-[320px] items-center justify-center border-l border-zinc-800 bg-zinc-950/95 px-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : detail ? (
            <ParkDetailPanel
              park={detail}
              layout="desktop"
              onClose={closePanel}
            />
          ) : null}
        </div>
      )}

      {selectedId && !desktop && (
        <>
          {detailLoading && !detail ? (
            <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">Loading park…</p>
            </div>
          ) : (
            detail && (
              <ParkDetailPanel
                park={detail}
                layout="mobile"
                onClose={closePanel}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
