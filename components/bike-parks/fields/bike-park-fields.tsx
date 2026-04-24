'use client';

import { useCallback, useMemo } from 'react';
import { BikeParkLocationPicker } from '@/components/admin/bike-park-location-picker';
import { TrailDifficultyCountPills } from '@/components/bike-parks/trail-difficulty-count-pills';
import { TrailDifficultyIcon } from '@/components/bike-parks/trail-difficulty-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BIKE_PARK_FACILITY_OPTIONS,
  type BikeParkFacilitySlug,
} from '@/lib/bike-parks/facilities';
import {
  OPENING_HOURS_DAYS,
  type OpeningHoursDayKey,
} from '@/lib/bike-parks/opening-hours-form';
import type { BikeParkFormFieldsState } from '@/lib/bike-parks/park-form-state';
import {
  bikeParkReviewSectionLabel,
  getReviewSectionPresentation,
  reviewDotClass,
  type BikeParkReviewSectionId,
} from '@/lib/bike-parks/park-review-section-meta';
import {
  TRAIL_DIFFICULTY_DESCRIPTIONS,
  TRAIL_DIFFICULTY_LABELS,
  TRAIL_DIFFICULTY_LEVELS,
  type TrailDifficultyLevel,
} from '@/lib/bike-parks/trail-difficulties';

export const BIKE_PARK_PATCH_FIELD_KEYS = [
  'name',
  'description',
  'latitude',
  'longitude',
  'website',
  'buyTicketUrl',
  'payment',
  'logoUrl',
  'pinLogoUrl',
  'openingHours',
  'trailDifficultyCounts',
  'facilities',
] as const;

export type BikeParkPatchFieldKey = (typeof BIKE_PARK_PATCH_FIELD_KEYS)[number];

export function isBikeParkPatchFieldKey(key: string): key is BikeParkPatchFieldKey {
  return (BIKE_PARK_PATCH_FIELD_KEYS as readonly string[]).includes(key);
}

export type BikeParkFieldsReviewConfig = {
  requestType: 'new_park' | 'amendment';
  baseline: BikeParkFormFieldsState;
  showPreviousBySection: Partial<Record<BikeParkReviewSectionId, boolean>>;
  onToggleShowPrevious: (sectionId: BikeParkReviewSectionId) => void;
};

type BikeParkFieldsProps = {
  idPrefix: string;
  value: BikeParkFormFieldsState;
  onChange: (next: BikeParkFormFieldsState) => void;
  googleMapsApiKey?: string;
  showLocationPicker?: boolean;
  showTrailDifficultyPills?: boolean;
  urlInputsAsUrl?: boolean;
  disabled?: boolean;
  descriptionRows?: number;
  /** When set, each field group is wrapped with review dots and optional “Show previous” vs baseline. */
  review?: BikeParkFieldsReviewConfig;
};

function BikeParkReviewSectionFrame({
  sectionId,
  review,
  value,
  disabled,
  children,
}: {
  sectionId: BikeParkReviewSectionId;
  review: BikeParkFieldsReviewConfig;
  value: BikeParkFormFieldsState;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const meta = useMemo(
    () =>
      getReviewSectionPresentation(sectionId, review.requestType, review.baseline, value),
    [review, sectionId, value],
  );
  const showPrevious = review.showPreviousBySection[sectionId] === true;
  const canToggle = meta.hasDifference && meta.hasPreviousValue;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={reviewDotClass(meta)} aria-hidden />
          <p className="truncate text-xs font-semibold text-zinc-200">
            {bikeParkReviewSectionLabel(sectionId)}
          </p>
        </div>
        {canToggle ? (
          <button
            type="button"
            disabled={disabled}
            className="shrink-0 text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline disabled:opacity-50"
            onClick={() => review.onToggleShowPrevious(sectionId)}
          >
            {showPrevious ? 'Hide previous' : 'Show previous'}
          </button>
        ) : null}
      </div>
      {children}
      {showPrevious && canToggle ? (
        <p className="mt-2 rounded border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs whitespace-pre-wrap break-words text-zinc-400">
          Previous: {meta.previousDisplay}
        </p>
      ) : null}
    </div>
  );
}

export function BikeParkFields({
  idPrefix,
  value,
  onChange,
  googleMapsApiKey,
  showLocationPicker = true,
  showTrailDifficultyPills = false,
  urlInputsAsUrl = false,
  disabled = false,
  descriptionRows = 5,
  review,
}: BikeParkFieldsProps) {
  const setPartial = useCallback(
    (patch: Partial<BikeParkFormFieldsState>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value],
  );

  const facilitySet = useMemo(() => new Set(value.facilities), [value.facilities]);
  const toggleFacility = useCallback(
    (slug: BikeParkFacilitySlug) => {
      const next = new Set(value.facilities);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      setPartial({ facilities: Array.from(next) });
    },
    [setPartial, value.facilities],
  );

  const setTrailCount = useCallback(
    (level: TrailDifficultyLevel, raw: string) => {
      const parsed = Number.parseInt(raw, 10);
      const n = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      setPartial({ trailDifficultyCounts: { ...value.trailDifficultyCounts, [level]: n } });
    },
    [setPartial, value.trailDifficultyCounts],
  );

  const setOpeningHour = useCallback(
    (day: OpeningHoursDayKey, v: string) => {
      setPartial({ openingHours: { ...value.openingHours, [day]: v } });
    },
    [setPartial, value.openingHours],
  );

  const urlType = urlInputsAsUrl ? 'url' : 'text';
  const urlPlaceholder = urlInputsAsUrl ? 'https://' : undefined;
  const inputClass = 'border-zinc-700 bg-zinc-900 text-white';
  const labelClass = 'text-zinc-300';
  const textAreaClass =
    'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white shadow-xs outline-none focus-visible:border-orange-500/60 focus-visible:ring-2 focus-visible:ring-orange-500/30';

  const nameBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-name`} className={labelClass}>
        Name <span className="text-red-400">*</span>
      </Label>
      <Input
        id={`${idPrefix}-name`}
        value={value.name}
        onChange={(e) => setPartial({ name: e.target.value })}
        required
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );

  const descriptionBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-desc`} className={labelClass}>
        Description <span className="text-red-400">*</span>
      </Label>
      <textarea
        id={`${idPrefix}-desc`}
        value={value.description}
        onChange={(e) => setPartial({ description: e.target.value })}
        required
        disabled={disabled}
        rows={descriptionRows}
        className={textAreaClass}
      />
    </div>
  );

  const locationBlock = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lat`} className={labelClass}>
            Latitude <span className="text-red-400">*</span>
          </Label>
          <Input
            id={`${idPrefix}-lat`}
            type="number"
            step="any"
            value={Number.isFinite(value.latitude) ? value.latitude : ''}
            onChange={(e) => setPartial({ latitude: Number.parseFloat(e.target.value) })}
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lng`} className={labelClass}>
            Longitude <span className="text-red-400">*</span>
          </Label>
          <Input
            id={`${idPrefix}-lng`}
            type="number"
            step="any"
            value={Number.isFinite(value.longitude) ? value.longitude : ''}
            onChange={(e) => setPartial({ longitude: Number.parseFloat(e.target.value) })}
            required
            disabled={disabled}
            className={inputClass}
          />
        </div>
      </div>
      {showLocationPicker && googleMapsApiKey ? (
        <BikeParkLocationPicker
          googleMapsApiKey={googleMapsApiKey}
          latitude={value.latitude}
          longitude={value.longitude}
          markerTitle={value.name}
          markerLogoUrl={value.pinLogoUrl || value.logoUrl}
          onLocationChange={(lat, lng) => {
            setPartial({ latitude: lat, longitude: lng });
          }}
        />
      ) : null}
    </div>
  );

  const websiteBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-web`} className={labelClass}>
        Website (optional)
      </Label>
      <Input
        id={`${idPrefix}-web`}
        type={urlType}
        value={value.website}
        onChange={(e) => setPartial({ website: e.target.value })}
        placeholder={urlPlaceholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );

  const buyTicketBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-buy-ticket`} className={labelClass}>
        Buy ticket URL (optional)
      </Label>
      <Input
        id={`${idPrefix}-buy-ticket`}
        type={urlType}
        value={value.buyTicketUrl}
        onChange={(e) => setPartial({ buyTicketUrl: e.target.value })}
        placeholder={urlPlaceholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );

  const paymentBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-pricing`} className={labelClass}>
        Pricing
      </Label>
      <label
        htmlFor={`${idPrefix}-pricing`}
        className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
      >
        <input
          id={`${idPrefix}-pricing`}
          type="checkbox"
          checked={value.requiresPayment}
          onChange={(e) => setPartial({ requiresPayment: e.target.checked })}
          disabled={disabled}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
        />
        <span>Payment required to ride this park</span>
      </label>
    </div>
  );

  const logoBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-logo`} className={labelClass}>
        Logo URL (optional)
      </Label>
      <Input
        id={`${idPrefix}-logo`}
        type={urlType}
        value={value.logoUrl}
        onChange={(e) => setPartial({ logoUrl: e.target.value })}
        placeholder={urlPlaceholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );

  const pinBlock = (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-pin`} className={labelClass}>
        Pin logo URL (optional)
      </Label>
      <Input
        id={`${idPrefix}-pin`}
        type={urlType}
        value={value.pinLogoUrl}
        onChange={(e) => setPartial({ pinLogoUrl: e.target.value })}
        placeholder={urlPlaceholder}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );

  const openingHoursBlock = (
    <div className="space-y-3">
      <Label className={labelClass}>Opening hours (optional)</Label>
      <p className="text-xs text-zinc-500">
        Fill the days you know. Leave a day blank if unknown. Use text like{' '}
        <code>09:00-17:00</code> or <code>Closed</code>.
      </p>
      <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        {OPENING_HOURS_DAYS.map((day) => (
          <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[120px_1fr]">
            <Label htmlFor={`${idPrefix}-opening-${day.key}`} className={labelClass}>
              {day.label}
            </Label>
            <Input
              id={`${idPrefix}-opening-${day.key}`}
              value={value.openingHours[day.key]}
              onChange={(e) => setOpeningHour(day.key, e.target.value)}
              placeholder="e.g. 09:00-17:00"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const trailsBlock = (
    <div className="space-y-3">
      <Label className={labelClass}>Trail difficulty counts</Label>
      <p className="text-xs text-zinc-500">
        Add the number of trails at each level. These level descriptions are global across
        Shredmap.
      </p>
      {showTrailDifficultyPills ? (
        <TrailDifficultyCountPills counts={value.trailDifficultyCounts} />
      ) : null}
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        {TRAIL_DIFFICULTY_LEVELS.map((level) => (
          <div key={level} className="grid gap-2 sm:grid-cols-[1fr_120px] sm:gap-4">
            <div>
              <Label
                htmlFor={`${idPrefix}-trails-${level}`}
                className="flex items-center gap-2 text-zinc-200"
              >
                <TrailDifficultyIcon level={level} />
                {TRAIL_DIFFICULTY_LABELS[level]}
              </Label>
              <p className="mt-1 text-xs text-zinc-500">{TRAIL_DIFFICULTY_DESCRIPTIONS[level]}</p>
            </div>
            <Input
              id={`${idPrefix}-trails-${level}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value.trailDifficultyCounts[level]}
              onChange={(e) => setTrailCount(level, e.target.value)}
              disabled={disabled}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const facilitiesBlock = (
    <div className="space-y-3">
      <Label className={labelClass}>Facilities (predefined)</Label>
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
              disabled={disabled}
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
  );

  if (review) {
    const r = review;
    const section = (sectionId: BikeParkReviewSectionId, body: React.ReactNode) => (
      <BikeParkReviewSectionFrame
        sectionId={sectionId}
        review={r}
        value={value}
        disabled={disabled}
      >
        {body}
      </BikeParkReviewSectionFrame>
    );
    return (
      <div className="space-y-6">
        {section('name', nameBlock)}
        {section('description', descriptionBlock)}
        {section('location', locationBlock)}
        {section('website', websiteBlock)}
        {section('buyTicketUrl', buyTicketBlock)}
        {section('payment', paymentBlock)}
        {section('logoUrl', logoBlock)}
        {section('pinLogoUrl', pinBlock)}
        {section('openingHours', openingHoursBlock)}
        {section('trailDifficultyCounts', trailsBlock)}
        {section('facilities', facilitiesBlock)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {nameBlock}
      {descriptionBlock}
      {locationBlock}
      {websiteBlock}
      {buyTicketBlock}
      {paymentBlock}
      {logoBlock}
      {pinBlock}
      {openingHoursBlock}
      {trailsBlock}
      {facilitiesBlock}
    </div>
  );
}
