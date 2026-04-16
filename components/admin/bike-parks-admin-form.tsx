'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BikeParkLocationPicker } from '@/components/admin/bike-park-location-picker';
import { Button } from '@/components/ui/button';
import { TrailDifficultyIcon } from '@/components/bike-parks/trail-difficulty-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BikePark } from '@/lib/db/schema';
import {
  amenitiesToSelectedFacilities,
  BIKE_PARK_FACILITY_OPTIONS,
  type BikeParkFacilitySlug,
} from '@/lib/bike-parks/facilities';
import {
  EMPTY_TRAIL_DIFFICULTY_COUNTS,
  TRAIL_DIFFICULTY_DESCRIPTIONS,
  TRAIL_DIFFICULTY_LABELS,
  TRAIL_DIFFICULTY_LEVELS,
  type TrailDifficultyLevel,
} from '@/lib/bike-parks/trail-difficulties';

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
const emptyTrailDifficultyCounts = () => ({ ...EMPTY_TRAIL_DIFFICULTY_COUNTS });
const openingHoursDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;
type OpeningHoursDay = (typeof openingHoursDays)[number]['key'];
type OpeningHoursFormState = Record<OpeningHoursDay, string>;
const emptyOpeningHours = (): OpeningHoursFormState => ({
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  saturday: '',
  sunday: '',
});

function openingHoursToFormState(
  openingHours: BikePark['openingHours'],
): OpeningHoursFormState {
  const initial = emptyOpeningHours();
  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) {
    return initial;
  }
  for (const day of openingHoursDays) {
    const value = Reflect.get(openingHours, day.key);
    if (typeof value === 'string') {
      initial[day.key] = value;
    }
  }
  return initial;
}

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
  const [buyTicketUrl, setBuyTicketUrl] = useState('');
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [pinLogoUrl, setPinLogoUrl] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHoursFormState>(
    emptyOpeningHours,
  );
  const [facilities, setFacilities] = useState<BikeParkFacilitySlug[]>([]);
  const [trailDifficultyCounts, setTrailDifficultyCounts] = useState(
    emptyTrailDifficultyCounts,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetToCreate = useCallback(() => {
    setEditingId('');
    setName('');
    setDescription('');
    setLatitude(defaultLat);
    setLongitude(defaultLng);
    setWebsite('');
    setBuyTicketUrl('');
    setRequiresPayment(false);
    setLogoUrl('');
    setPinLogoUrl('');
    setOpeningHours(emptyOpeningHours());
    setFacilities([]);
    setTrailDifficultyCounts(emptyTrailDifficultyCounts());
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
        setBuyTicketUrl(park.buyTicketUrl ?? '');
        setRequiresPayment(park.payment === 'paid');
        setLogoUrl(park.logoUrl ?? '');
        setPinLogoUrl(park.pinLogoUrl ?? '');
        setOpeningHours(openingHoursToFormState(park.openingHours));
        setFacilities(amenitiesToSelectedFacilities(park.amenities));
        setTrailDifficultyCounts(
          park.trailDifficultyCounts ?? emptyTrailDifficultyCounts(),
        );
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
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const trimmedWebsite = website.trim();
      const trimmedBuyTicketUrl = buyTicketUrl.trim();
      const trimmedLogoUrl = logoUrl.trim();
      const trimmedPinLogoUrl = pinLogoUrl.trim();
      const openingHoursEntries = openingHoursDays
        .map(({ key }) => [key, openingHours[key].trim()] as const)
        .filter(([, value]) => value.length > 0);
      const openingHoursPayload =
        openingHoursEntries.length > 0 ? Object.fromEntries(openingHoursEntries) : null;
      const body = {
        name: trimmedName,
        description: trimmedDescription,
        latitude,
        longitude,
        ...(trimmedWebsite ? { website: trimmedWebsite } : {}),
        ...(trimmedBuyTicketUrl ? { buyTicketUrl: trimmedBuyTicketUrl } : {}),
        payment: requiresPayment ? 'paid' : 'free',
        ...(trimmedLogoUrl ? { logoUrl: trimmedLogoUrl } : {}),
        ...(trimmedPinLogoUrl ? { pinLogoUrl: trimmedPinLogoUrl } : {}),
        openingHours: openingHoursPayload,
        facilities,
        trailDifficultyCounts,
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
  const facilitySet = useMemo(() => new Set(facilities), [facilities]);
  const toggleFacility = useCallback((slug: BikeParkFacilitySlug) => {
    setFacilities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return Array.from(next);
    });
  }, []);
  const setTrailCount = useCallback(
    (level: TrailDifficultyLevel, value: string) => {
      const parsed = Number.parseInt(value, 10);
      const next = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      setTrailDifficultyCounts((prev) => ({ ...prev, [level]: next }));
    },
    [],
  );
  const setOpeningHour = useCallback((day: OpeningHoursDay, value: string) => {
    setOpeningHours((prev) => ({ ...prev, [day]: value }));
  }, []);

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
          <Label htmlFor="bp-buy-ticket" className="text-zinc-300">
            Buy ticket URL (optional)
          </Label>
          <Input
            id="bp-buy-ticket"
            type="url"
            value={buyTicketUrl}
            onChange={(e) => setBuyTicketUrl(e.target.value)}
            placeholder="https://"
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-pricing" className="text-zinc-300">
            Pricing
          </Label>
          <label
            htmlFor="bp-pricing"
            className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          >
            <input
              id="bp-pricing"
              type="checkbox"
              checked={requiresPayment}
              onChange={(e) => setRequiresPayment(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
            />
            <span>Payment required to ride this park</span>
          </label>
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

        <div className="space-y-3">
          <Label className="text-zinc-300">Opening hours (optional)</Label>
          <p className="text-xs text-zinc-500">
            Fill the days you know. Leave a day blank if unknown. Use text like
            {' '}
            <code>09:00-17:00</code>
            {' '}
            or
            {' '}
            <code>Closed</code>.
          </p>
          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            {openingHoursDays.map((day) => (
              <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[120px_1fr]">
                <Label htmlFor={`bp-opening-${day.key}`} className="text-zinc-300">
                  {day.label}
                </Label>
                <Input
                  id={`bp-opening-${day.key}`}
                  value={openingHours[day.key]}
                  onChange={(e) => setOpeningHour(day.key, e.target.value)}
                  placeholder="e.g. 09:00-17:00"
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-zinc-300">Trail difficulty counts</Label>
          <p className="text-xs text-zinc-500">
            Add the number of trails at each level. These level descriptions are
            global across Shredmap.
          </p>
          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            {TRAIL_DIFFICULTY_LEVELS.map((level) => (
              <div key={level} className="grid gap-2 sm:grid-cols-[1fr_120px] sm:gap-4">
                <div>
                  <Label
                    htmlFor={`bp-trails-${level}`}
                    className="flex items-center gap-2 text-zinc-200"
                  >
                    <TrailDifficultyIcon level={level} />
                    {TRAIL_DIFFICULTY_LABELS[level]}
                  </Label>
                  <p className="mt-1 text-xs text-zinc-500">
                    {TRAIL_DIFFICULTY_DESCRIPTIONS[level]}
                  </p>
                </div>
                <Input
                  id={`bp-trails-${level}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={trailDifficultyCounts[level]}
                  onChange={(e) => setTrailCount(level, e.target.value)}
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-zinc-300">Facilities (predefined)</Label>
          <p className="text-xs text-zinc-500">
            Select all facilities that apply. Only these predefined tags are allowed.
          </p>
          <div className="flex flex-wrap gap-2">
            {BIKE_PARK_FACILITY_OPTIONS.map((facility) => {
              const selected = facilitySet.has(facility.slug);
              return (
                <button
                  key={facility.slug}
                  type="button"
                  onClick={() => toggleFacility(facility.slug)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? 'border-orange-500/40 bg-orange-500/20 text-orange-100'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                  aria-pressed={selected}
                >
                  {facility.label}
                </button>
              );
            })}
          </div>
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
