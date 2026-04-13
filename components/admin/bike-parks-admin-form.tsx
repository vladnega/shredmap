'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BikeParkLocationPicker } from '@/components/admin/bike-park-location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BikePark } from '@/lib/db/schema';

type MarkerRow = { id: string; name: string };

function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const defaultLat = 51.058;
const defaultLng = -0.161;

export function BikeParksAdminForm({ googleMapsApiKey }: { googleMapsApiKey: string }) {
  const [markers, setMarkers] = useState<MarkerRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(defaultLat);
  const [longitude, setLongitude] = useState(defaultLng);
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [pinLogoUrl, setPinLogoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadMarkers = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/bike-parks');
      if (!res.ok) {
        setLoadError(`Could not load parks (${res.status})`);
        return;
      }
      const data: unknown = await res.json();
      if (
        typeof data !== 'object' ||
        data === null ||
        !('parks' in data) ||
        !Array.isArray((data as { parks: unknown }).parks)
      ) {
        setLoadError('Unexpected parks list response');
        return;
      }
      const rows = (data as { parks: MarkerRow[] }).parks;
      setMarkers(rows);
    } catch {
      setLoadError('Could not load parks');
    }
  }, []);

  useEffect(() => {
    void loadMarkers();
  }, [loadMarkers]);

  const resetToCreate = useCallback(() => {
    setEditingId('');
    setName('');
    setDescription('');
    setLatitude(defaultLat);
    setLongitude(defaultLng);
    setWebsite('');
    setLogoUrl('');
    setPinLogoUrl('');
    setMessage(null);
  }, []);

  const loadParkForEdit = useCallback(
    async (id: string) => {
      if (!id) {
        resetToCreate();
        return;
      }
      setBusy(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/bike-parks/${id}`);
        if (!res.ok) {
          setMessage(`Could not load park (${res.status})`);
          setBusy(false);
          return;
        }
        const park: BikePark = await res.json();
        setEditingId(park.id);
        setName(park.name);
        setDescription(
          park.description ? htmlToPlainText(park.description) : '',
        );
        setLatitude(park.latitude);
        setLongitude(park.longitude);
        setWebsite(park.primaryCtaUrl ?? '');
        setLogoUrl(park.logoUrl ?? '');
        setPinLogoUrl(park.pinLogoUrl ?? '');
      } catch {
        setMessage('Could not load park');
      } finally {
        setBusy(false);
      }
    },
    [resetToCreate],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        latitude,
        longitude,
        ...(website.trim() ? { website: website.trim() } : {}),
        ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
        ...(pinLogoUrl.trim() ? { pinLogoUrl: pinLogoUrl.trim() } : {}),
      };

      if (editingId) {
        const res = await fetch(`/api/bike-parks/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setMessage(
            typeof err === 'object' && err && 'error' in err
              ? String((err as { error: string }).error)
              : `Update failed (${res.status})`,
          );
          setBusy(false);
          return;
        }
        setMessage('Park updated.');
      } else {
        const res = await fetch('/api/bike-parks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setMessage(
            typeof err === 'object' && err && 'error' in err
              ? String((err as { error: string }).error)
              : `Create failed (${res.status})`,
          );
          setBusy(false);
          return;
        }
        const created: BikePark = await res.json();
        setMessage('Park created.');
        setEditingId(created.id);
      }
      await loadMarkers();
    } catch {
      setMessage('Request failed');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!editingId) return;
    if (!window.confirm('Delete this bike park? This cannot be undone.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/bike-parks/${editingId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        setMessage(`Delete failed (${res.status})`);
        setBusy(false);
        return;
      }
      setMessage('Park deleted.');
      resetToCreate();
      await loadMarkers();
    } catch {
      setMessage('Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="park-select" className="text-zinc-300">
            Edit existing
          </Label>
          <select
            id="park-select"
            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
            value={editingId}
            onChange={(e) => void loadParkForEdit(e.target.value)}
            disabled={busy}
          >
            <option value="">— New park —</option>
            {markers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-zinc-600 text-zinc-200"
          onClick={() => {
            resetToCreate();
          }}
          disabled={busy}
        >
          Clear form
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="border border-zinc-600"
          onClick={() => void loadMarkers()}
          disabled={busy}
        >
          Refresh list
        </Button>
      </div>

      {loadError && <p className="text-sm text-red-400">{loadError}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="bp-name" className="text-zinc-300">
            Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="bp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-desc" className="text-zinc-300">
            Description <span className="text-red-400">*</span>
          </Label>
          <textarea
            id="bp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white shadow-xs outline-none focus-visible:border-orange-500/60 focus-visible:ring-2 focus-visible:ring-orange-500/30"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bp-lat" className="text-zinc-300">
              Latitude <span className="text-red-400">*</span>
            </Label>
            <Input
              id="bp-lat"
              type="number"
              step="any"
              value={Number.isFinite(latitude) ? latitude : ''}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              required
              className="border-zinc-700 bg-zinc-900 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bp-lng" className="text-zinc-300">
              Longitude <span className="text-red-400">*</span>
            </Label>
            <Input
              id="bp-lng"
              type="number"
              step="any"
              value={Number.isFinite(longitude) ? longitude : ''}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              required
              className="border-zinc-700 bg-zinc-900 text-white"
            />
          </div>
        </div>

        <BikeParkLocationPicker
          googleMapsApiKey={googleMapsApiKey}
          latitude={latitude}
          longitude={longitude}
          onLocationChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="bp-web" className="text-zinc-300">
            Website (optional)
          </Label>
          <Input
            id="bp-web"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-logo" className="text-zinc-300">
            Logo URL (optional)
          </Label>
          <Input
            id="bp-logo"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://"
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-pin" className="text-zinc-300">
            Pin logo URL (optional)
          </Label>
          <Input
            id="bp-pin"
            type="url"
            value={pinLogoUrl}
            onChange={(e) => setPinLogoUrl(e.target.value)}
            placeholder="https://"
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy}
            className="bg-orange-600 text-white hover:bg-orange-500"
          >
            {editingId ? 'Save changes' : 'Create park'}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              Delete park
            </Button>
          ) : null}
          <Button type="button" variant="ghost" asChild>
            <Link href="/" className="text-zinc-400">
              Back to map
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
