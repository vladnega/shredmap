'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BikeParkLocationPicker } from '@/components/admin/bike-park-location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BikePark } from '@/lib/db/schema';

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

export function BikeParksAdminForm({
  googleMapsApiKey,
  initialParkId,
}: {
  googleMapsApiKey: string;
  initialParkId?: string;
}) {
  const router = useRouter();
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

  useEffect(() => {
    if (!initialParkId) {
      return;
    }
    if (initialParkId === editingId) {
      return;
    }
    void loadParkForEdit(initialParkId);
  }, [editingId, initialParkId, loadParkForEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) {
      setMessage('Pick a bike park from Manage parks first.');
      return;
    }
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
      router.push('/admin/bike-parks');
    } catch {
      setMessage('Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const submitDisabled = busy || !editingId;

  return (
    <div className="space-y-8">
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
          markerTitle={name}
          markerLogoUrl={pinLogoUrl || logoUrl}
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
            disabled={submitDisabled}
            className="bg-orange-600 text-white hover:bg-orange-500"
          >
            Save changes
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
        </div>
      </form>
    </div>
  );
}
