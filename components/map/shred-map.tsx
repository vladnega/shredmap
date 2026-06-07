'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { BikePark } from '@/lib/db/schema';
import { fetchBikeParksForMap } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import {
  createEmptyBikeParkMarkerRegistry,
  replaceBikeParkMarkersOnMap,
  type BikeParkMarkerRegistry,
} from '@/components/map/replace-bike-park-markers';
import { ParkDetailPanel } from '@/components/map/park-detail-panel';
import { MapChrome } from '@/components/map/map-chrome';
import { ParkSearch } from '@/components/map/park-search/park-search';
import { flyMapToPark } from '@/lib/map/fly-map-to-park';
import { highlightBikeParkMarker } from '@/lib/map/highlight-bike-park-marker';
import { Button } from '@/components/ui/button';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';
import { formatLocalCalendarDay } from '@/lib/date/local-calendar-day';
import { fetchMatesOnMapCounts } from '@/lib/social/fetch-mates-on-map';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { detachMapMarker } from '@/lib/map/advanced-markers';
import {
  configureGoogleMapsApiKey,
  ensureMarkerLibraryLoaded,
  loadGoogleMapsLibrary,
} from '@/lib/map/google-maps-loader';
import { shredmapMapBaseOptions } from '@/lib/map/google-maps-theme';

const UK_CENTER = { lat: 54.2, lng: -2.5 };
const DEFAULT_ZOOM = 6;

export function ShredMap({
  googleMapsApiKey,
  initialParkId = null,
}: {
  googleMapsApiKey: string;
  initialParkId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<BikeParkMarkerRegistry>(createEmptyBikeParkMarkerRegistry());
  const [mapParks, setMapParks] = useState<BikeParkMapPoint[]>([]);
  const { data: appUser } = useAppUser();

  const [mapReady, setMapReady] = useState(false);
  const [parksError, setParksError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialParkId);
  const [detail, setDetail] = useState<BikePark | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [rideDay, setRideDay] = useState(() => formatLocalCalendarDay(new Date()));

  useEffect(() => {
    if (initialParkId) {
      setSelectedId(initialParkId);
    }
  }, [initialParkId]);

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

  const refreshMapMarkers = useCallback(
    async (signal?: AbortSignal) => {
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

      let parks: BikeParkMapPoint[] = result.parks;

      if (appUser) {
        try {
          const counts = await fetchMatesOnMapCounts(rideDay, signal);
          if (signal?.aborted || !mapRef.current) return;
          parks = parks.map((p) => ({
            ...p,
            matesRidingCount: counts[p.id] ?? 0,
          }));
        } catch {
          if (signal?.aborted || !mapRef.current) return;
          parks = parks.map((p) => ({ ...p, matesRidingCount: 0 }));
        }
      } else {
        parks = parks.map((p) => ({ ...p, matesRidingCount: 0 }));
      }

      const map = mapRef.current;
      await replaceBikeParkMarkersOnMap(map, markersRef, parks, (id) => {
        highlightBikeParkMarker(markersRef.current, id);
        setSelectedId(id);
      });
      setMapParks(parks);
    },
    [appUser, rideDay],
  );

  useEffect(() => {
    if (!containerRef.current || !googleMapsApiKey) return;

    let cancelled = false;

    void (async () => {
      configureGoogleMapsApiKey(googleMapsApiKey);
      await loadGoogleMapsLibrary();
      await ensureMarkerLibraryLoaded();
      const baseOptions = await shredmapMapBaseOptions();
      if (cancelled || !containerRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        ...baseOptions,
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
      });
      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      markersRef.current.markers.forEach(detachMapMarker);
      markersRef.current = createEmptyBikeParkMarkerRegistry();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ac = new AbortController();
    void refreshMapMarkers(ac.signal);
    return () => ac.abort();
  }, [mapReady, refreshMapMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    window.setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 320);
  }, [mapReady, desktop]);

  const closePanel = useCallback(() => {
    highlightBikeParkMarker(markersRef.current, null);
    setSelectedId(null);
    setDetail(null);
  }, []);

  const handleSearchSelectPark = useCallback((park: BikeParkMapPoint) => {
    const map = mapRef.current;
    if (!map) return;
    flyMapToPark(map, park);
    highlightBikeParkMarker(markersRef.current, park.id);
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
            onClick={() => void refreshMapMarkers()}
          >
            Try again
          </Button>
        </div>
      )}

      <MapChrome
        rideDay={appUser ? rideDay : undefined}
        onRideDayChange={appUser ? setRideDay : undefined}
        search={
          <ParkSearch
            parks={mapParks}
            disabled={!mapReady || mapParks.length === 0}
            onSelectPark={handleSearchSelectPark}
          />
        }
      />

      <div
        className="pointer-events-auto fixed bottom-4 left-4 sm:bottom-6 sm:left-6"
        style={{ zIndex: MAP_UI_LAYER_Z.mapChrome }}
      >
        <Button
          asChild
          size="icon"
          className="h-12 w-12 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-900/40 hover:bg-orange-500"
        >
          <Link href="/bike-parks/park-request/new" aria-label="Propose new park">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>

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
              onRidePlanSaved={() => void refreshMapMarkers()}
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
                onRidePlanSaved={() => void refreshMapMarkers()}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
