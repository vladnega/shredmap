'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { googleMapsEmbedUrl } from '@/lib/map/google-maps-embed';

const PICKER_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
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

type BikeParkLocationPickerProps = {
  googleMapsApiKey: string;
  latitude: number;
  longitude: number;
  markerTitle?: string;
  markerLogoUrl?: string;
  onLocationChange: (lat: number, lng: number) => void;
};

function buildMarkerIcon(logoUrl?: string): google.maps.Icon | undefined {
  const trimmed = logoUrl?.trim();
  if (!trimmed) return undefined;

  return {
    url: trimmed,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  };
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
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const syncMarkerPosition = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat, lng };
    marker.setPosition(pos);
    map.panTo(pos);
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey || !containerRef.current) return;

    let cancelled = false;

    void (async () => {
      setOptions({ key: googleMapsApiKey, v: 'weekly' });
      await importLibrary('maps');
      if (cancelled || !containerRef.current) return;

      const center = { lat: latitude, lng: longitude };
      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: PICKER_STYLES,
        backgroundColor: '#0a0a0a',
      });
      mapRef.current = map;

      const marker = new google.maps.Marker({
        map,
        position: center,
        draggable: true,
        title: markerTitle?.trim() || 'Bike park location',
        icon: buildMarkerIcon(markerLogoUrl),
      });
      markerRef.current = marker;

      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if (p) {
          onLocationChangeRef.current(p.lat(), p.lng());
        }
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition(e.latLng);
        onLocationChangeRef.current(lat, lng);
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!ready || !marker) return;

    marker.setTitle(markerTitle?.trim() || 'Bike park location');
    marker.setIcon(buildMarkerIcon(markerLogoUrl) ?? null);
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
        <div className="relative h-64 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
