'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BikeParkLocationPicker } from '@/components/admin/bike-park-location-picker';
import { BikeParkReadOnlyBody } from '@/components/bike-parks/bike-park-read-only-body';
import { TrailDifficultyCountPills } from '@/components/bike-parks/trail-difficulty-count-pills';
import { TrailDifficultyIcon } from '@/components/bike-parks/trail-difficulty-icon';
import { ParkRequestListingPreview } from '@/components/park-requests/park-request-listing-preview';
import { ParkReviewSummaryHeader } from '@/components/reviews/park-review-summary-header';
import { Button } from '@/components/ui/button';
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
  type TrailDifficultyCounts,
  type TrailDifficultyLevel,
} from '@/lib/bike-parks/trail-difficulties';

type ParkRequestFormProps =
  | { mode: 'amendment'; targetPark: BikePark; googleMapsApiKey: string }
  | { mode: 'new_park'; googleMapsApiKey: string };

function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function openingHoursToRecord(input: BikePark['openingHours']): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }
  return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      acc[key] = value.trim();
    }
    return acc;
  }, {});
}

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

const defaultLat = 51.058;
const defaultLng = -0.161;
const emptyTrailDifficultyCounts = () => ({ ...EMPTY_TRAIL_DIFFICULTY_COUNTS });
const emptyOpeningHours = (): OpeningHoursFormState => ({
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  saturday: '',
  sunday: '',
});

function openingHoursToFormState(openingHours: BikePark['openingHours']): OpeningHoursFormState {
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

export function ParkRequestForm(props: ParkRequestFormProps) {
  const router = useRouter();
  const initial = useMemo(() => {
    if (props.mode === 'new_park') {
      return {
        name: '',
        description: '',
        latitude: defaultLat,
        longitude: defaultLng,
        website: '',
        buyTicketUrl: '',
        requiresPayment: false,
        logoUrl: '',
        pinLogoUrl: '',
        facilities: [] as BikeParkFacilitySlug[],
        trailDifficultyCounts: emptyTrailDifficultyCounts(),
        openingHours: emptyOpeningHours(),
      };
    }

    return {
      name: props.targetPark.name,
      description: props.targetPark.description
        ? htmlToPlainText(props.targetPark.description)
        : '',
      latitude: props.targetPark.latitude,
      longitude: props.targetPark.longitude,
      website: props.targetPark.primaryCtaUrl ?? '',
      buyTicketUrl: props.targetPark.buyTicketUrl ?? '',
      requiresPayment: props.targetPark.payment === 'paid',
      logoUrl: props.targetPark.logoUrl ?? '',
      pinLogoUrl: props.targetPark.pinLogoUrl ?? '',
      facilities: amenitiesToSelectedFacilities(props.targetPark.amenities),
      trailDifficultyCounts: props.targetPark.trailDifficultyCounts ?? emptyTrailDifficultyCounts(),
      openingHours: openingHoursToFormState(props.targetPark.openingHours),
    };
  }, [props]);

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [latitude, setLatitude] = useState(initial.latitude);
  const [longitude, setLongitude] = useState(initial.longitude);
  const [website, setWebsite] = useState(initial.website);
  const [buyTicketUrl, setBuyTicketUrl] = useState(initial.buyTicketUrl);
  const [requiresPayment, setRequiresPayment] = useState(initial.requiresPayment);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [pinLogoUrl, setPinLogoUrl] = useState(initial.pinLogoUrl);
  const [openingHours, setOpeningHours] = useState<OpeningHoursFormState>(initial.openingHours);
  const [facilities, setFacilities] = useState<BikeParkFacilitySlug[]>(initial.facilities);
  const [trailDifficultyCounts, setTrailDifficultyCounts] = useState<TrailDifficultyCounts>(
    initial.trailDifficultyCounts,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const facilitySet = useMemo(() => new Set(facilities), [facilities]);
  function toggleFacility(slug: BikeParkFacilitySlug) {
    setFacilities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return Array.from(next);
    });
  }

  function setTrailCount(level: TrailDifficultyLevel, value: string) {
    const parsed = Number.parseInt(value, 10);
    setTrailDifficultyCounts((prev) => ({
      ...prev,
      [level]: Number.isFinite(parsed) ? Math.max(parsed, 0) : 0,
    }));
  }

  const setOpeningHour = useCallback((day: OpeningHoursDay, value: string) => {
    setOpeningHours((prev) => ({ ...prev, [day]: value }));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payloadBase = {
        name: name.trim(),
        description: description.trim(),
        latitude,
        longitude,
        website: website.trim(),
        buyTicketUrl: buyTicketUrl.trim(),
        payment: requiresPayment ? 'paid' : 'free',
        logoUrl: logoUrl.trim(),
        pinLogoUrl: pinLogoUrl.trim(),
        facilities,
        trailDifficultyCounts,
        openingHours: Object.fromEntries(
          openingHoursDays
            .map(({ key }) => [key, openingHours[key].trim()] as const)
            .filter(([, value]) => value.length > 0),
        ),
      };

      let body: unknown;
      if (props.mode === 'new_park') {
        body = {
          requestType: 'new_park',
          proposedPatch: payloadBase,
        };
      } else {
        const proposedPatch: Record<string, unknown> = {};
        if (payloadBase.name !== initial.name) proposedPatch.name = payloadBase.name;
        if (payloadBase.description !== initial.description) proposedPatch.description = payloadBase.description;
        if (payloadBase.latitude !== initial.latitude) proposedPatch.latitude = payloadBase.latitude;
        if (payloadBase.longitude !== initial.longitude) proposedPatch.longitude = payloadBase.longitude;
        if (payloadBase.website !== initial.website) proposedPatch.website = payloadBase.website || null;
        if (payloadBase.buyTicketUrl !== initial.buyTicketUrl) proposedPatch.buyTicketUrl = payloadBase.buyTicketUrl || null;
        if (payloadBase.payment !== (initial.requiresPayment ? 'paid' : 'free')) {
          proposedPatch.payment = payloadBase.payment;
        }
        if (payloadBase.logoUrl !== initial.logoUrl) proposedPatch.logoUrl = payloadBase.logoUrl || null;
        if (payloadBase.pinLogoUrl !== initial.pinLogoUrl) proposedPatch.pinLogoUrl = payloadBase.pinLogoUrl || null;
        if (JSON.stringify(payloadBase.facilities) !== JSON.stringify(initial.facilities)) {
          proposedPatch.facilities = payloadBase.facilities;
        }
        if (
          JSON.stringify(payloadBase.trailDifficultyCounts) !==
          JSON.stringify(initial.trailDifficultyCounts)
        ) {
          proposedPatch.trailDifficultyCounts = payloadBase.trailDifficultyCounts;
        }
        if (JSON.stringify(payloadBase.openingHours) !== JSON.stringify(initial.openingHours)) {
          proposedPatch.openingHours = payloadBase.openingHours;
        }
        if (Object.keys(proposedPatch).length === 0) {
          setMessage('No changes detected yet.');
          setBusy(false);
          return;
        }
        body = {
          requestType: 'amendment',
          targetParkId: props.targetPark.id,
          proposedPatch,
        };
      }

      const res = await fetch('/api/park-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Request failed (${res.status})`,
        );
        setBusy(false);
        return;
      }

      setMessage('Park Request submitted.');
      router.push('/');
    } catch {
      setMessage('Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="w-full lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {props.mode === 'amendment' ? 'Current Shredmap listing' : 'Listing preview'}
          </p>
          {props.mode === 'amendment' ? (
            <>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
                {props.targetPark.name}
              </h2>
              <ParkReviewSummaryHeader bikeParkId={props.targetPark.id} />
              <BikeParkReadOnlyBody park={props.targetPark} showStaticLocationMap />
            </>
          ) : (
            <ParkRequestListingPreview
              name={name}
              descriptionPlain={description}
              latitude={latitude}
              longitude={longitude}
              logoUrl={logoUrl}
              website={website}
              buyTicketUrl={buyTicketUrl}
              requiresPayment={requiresPayment}
              openingHours={openingHours}
              trailDifficultyCounts={trailDifficultyCounts}
              facilitySlugs={facilities}
            />
          )}
        </div>
      </aside>

      <form onSubmit={(e) => void onSubmit(e)} className="w-full min-w-0 max-w-2xl space-y-6 lg:max-w-none">
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="pr-name" className="text-zinc-300">
          Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="pr-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-zinc-700 bg-zinc-900 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pr-desc" className="text-zinc-300">
          Description <span className="text-red-400">*</span>
        </Label>
        <textarea
          id="pr-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pr-lat" className="text-zinc-300">
            Latitude <span className="text-red-400">*</span>
          </Label>
          <Input
            id="pr-lat"
            type="number"
            step="any"
            value={Number.isFinite(latitude) ? latitude : ''}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            required
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-lng" className="text-zinc-300">
            Longitude <span className="text-red-400">*</span>
          </Label>
          <Input
            id="pr-lng"
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
        googleMapsApiKey={props.googleMapsApiKey}
        latitude={latitude}
        longitude={longitude}
        markerTitle={name}
        markerLogoUrl={pinLogoUrl || logoUrl}
        onLocationChange={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-zinc-300">Website (optional)</Label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Buy ticket URL (optional)</Label>
          <Input
            value={buyTicketUrl}
            onChange={(e) => setBuyTicketUrl(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pr-pricing" className="text-zinc-300">
            Pricing
          </Label>
          <label
            htmlFor="pr-pricing"
            className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          >
            <input
              id="pr-pricing"
              type="checkbox"
              checked={requiresPayment}
              onChange={(e) => setRequiresPayment(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
            />
            <span>Payment required to ride this park</span>
          </label>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Logo URL (optional)</Label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Pin logo URL (optional)</Label>
        <Input
          value={pinLogoUrl}
          onChange={(e) => setPinLogoUrl(e.target.value)}
          className="border-zinc-700 bg-zinc-900 text-white"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-zinc-300">Opening hours (optional)</Label>
        <p className="text-xs text-zinc-500">
          Fill the days you know. Leave a day blank if unknown. Use text like{' '}
          <code>09:00-17:00</code> or <code>Closed</code>.
        </p>
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
          {openingHoursDays.map((day) => (
            <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[120px_1fr]">
              <Label htmlFor={`pr-opening-${day.key}`} className="text-zinc-300">
                {day.label}
              </Label>
              <Input
                id={`pr-opening-${day.key}`}
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
          Add the number of trails at each level. These level descriptions are global across
          Shredmap.
        </p>
        <TrailDifficultyCountPills counts={trailDifficultyCounts} />
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
          {TRAIL_DIFFICULTY_LEVELS.map((level) => (
            <div key={level} className="grid gap-2 sm:grid-cols-[1fr_120px] sm:gap-4">
              <div>
                <Label htmlFor={`pr-trails-${level}`} className="flex items-center gap-2 text-zinc-200">
                  <TrailDifficultyIcon level={level} />
                  {TRAIL_DIFFICULTY_LABELS[level]}
                </Label>
                <p className="mt-1 text-xs text-zinc-500">{TRAIL_DIFFICULTY_DESCRIPTIONS[level]}</p>
              </div>
              <Input
                id={`pr-trails-${level}`}
                type="number"
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
          {BIKE_PARK_FACILITY_OPTIONS.map((facility) => (
            <button
              key={facility.slug}
              type="button"
              onClick={() => toggleFacility(facility.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                facilitySet.has(facility.slug)
                  ? 'border-orange-500/40 bg-orange-500/20 text-orange-100'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {facility.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="bg-orange-600 text-white hover:bg-orange-500"
      >
        {busy ? 'Submitting…' : 'Submit Park Request'}
      </Button>
    </form>
    </div>
  );
}
