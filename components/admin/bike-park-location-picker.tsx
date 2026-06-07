'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createLocationPickerPinElement,
} from '@/lib/map/advanced-markers';
import { googleMapsEmbedUrl } from '@/lib/map/google-maps-embed';
import {
  configureGoogleMapsApiKey,
  ensureMarkerLibraryLoaded,
  loadGoogleMapsLibrary,
} from '@/lib/map/google-maps-loader';
import { shredmapMapBaseOptions } from '@/lib/map/google-maps-theme';

const MAP_CONTAINER_CLASSNAME =
  'relative h-[60dvh] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900';

type BikeParkLocationPickerProps = {
  googleMapsApiKey: string;
  latitude: number;
  longitude: number;
  markerTitle?: string;
  markerLogoUrl?: string;
  onLocationChange: (lat: number, lng: number) => void;
};

function buildMarkerContent(logoUrl?: string): Node {
  const trimmed = logoUrl?.trim();
  if (trimmed) {
    const img = document.createElement('img');
    img.src = trimmed;
    img.alt = '';
    img.draggable = false;
    img.style.width = '40px';
    img.style.height = '40px';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    img.style.border = '2px solid rgba(255, 255, 255, 0.45)';
    img.style.display = 'block';
    return img;
  }

  return createLocationPickerPinElement();
}

function readMarkerLatLng(
  position: google.maps.LatLng | google.maps.LatLngLiteral | null,
): { lat: number; lng: number } | null {
  if (!position) return null;
  if (position instanceof google.maps.LatLng) {
    return { lat: position.lat(), lng: position.lng() };
  }
  return { lat: position.lat, lng: position.lng };
}

export function BikeParkLocationPicker({
  googleMapsApiKey,
  latitude,
  longitude,
  markerTitle,
  markerLogoUrl,
  onLocationChange,
}: BikeParkLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [ready, setReady] = useState(false);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const syncMarkerPosition = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat, lng };
    marker.position = pos;
    map.panTo(pos);
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey || !containerRef.current) return;

    let cancelled = false;

    void (async () => {
      configureGoogleMapsApiKey(googleMapsApiKey);
      await loadGoogleMapsLibrary();
      const { AdvancedMarkerElement } = await ensureMarkerLibraryLoaded();
      const baseOptions = await shredmapMapBaseOptions();
      if (cancelled || !containerRef.current) return;

      const center = { lat: latitude, lng: longitude };
      const map = new google.maps.Map(containerRef.current, {
        ...baseOptions,
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;

      const marker = new AdvancedMarkerElement({
        map,
        position: center,
        gmpDraggable: true,
        title: markerTitle?.trim() || 'Bike park location',
        content: buildMarkerContent(markerLogoUrl),
      });
      markerRef.current = marker;

      marker.addListener('dragend', () => {
        const coords = readMarkerLatLng(marker.position);
        if (coords) {
          onLocationChangeRef.current(coords.lat, coords.lng);
        }
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.position = { lat, lng };
        onLocationChangeRef.current(lat, lng);
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!ready || !marker) return;

    marker.title = markerTitle?.trim() || 'Bike park location';
    marker.content = buildMarkerContent(markerLogoUrl);
  }, [markerLogoUrl, markerTitle, ready]);

  useEffect(() => {
    if (!ready) return;
    syncMarkerPosition(latitude, longitude);
  }, [latitude, longitude, ready, syncMarkerPosition]);

  if (!googleMapsApiKey) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-zinc-500">
          Embedded map preview (no API key). Set{' '}
          <code className="text-orange-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for the
          interactive pin picker (drag marker / click map).
        </p>
        <div className={MAP_CONTAINER_CLASSNAME}>
          <iframe
            title="Bike park location preview"
            src={googleMapsEmbedUrl(latitude, longitude)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        Click the map or drag the pin to set coordinates (also editable in the fields above).
      </p>
      <div className={MAP_CONTAINER_CLASSNAME}>
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full"
          role="application"
          aria-label="Pick bike park location on map"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm text-zinc-500">
            Loading map picker…
          </div>
        )}
      </div>
    </div>
  );
}
