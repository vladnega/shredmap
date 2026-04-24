import { BIKE_PARK_FACILITY_SLUGS, type BikeParkFacilitySlug } from '@/lib/bike-parks/facilities';
import { openingHoursFormToPayloadRecord } from '@/lib/bike-parks/opening-hours-form';
import type { BikeParkFormFieldsState } from '@/lib/bike-parks/park-form-state';
import {
  EMPTY_TRAIL_DIFFICULTY_COUNTS,
  TRAIL_DIFFICULTY_LEVELS,
  type TrailDifficultyCounts,
} from '@/lib/bike-parks/trail-difficulties';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFacilities(value: unknown): BikeParkFacilitySlug[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(BIKE_PARK_FACILITY_SLUGS);
  return value.filter((e): e is BikeParkFacilitySlug => typeof e === 'string' && allowed.has(e));
}

function parseTrailCounts(value: unknown): TrailDifficultyCounts {
  const base: TrailDifficultyCounts = { ...EMPTY_TRAIL_DIFFICULTY_COUNTS };
  if (!isRecord(value)) return base;
  for (const level of TRAIL_DIFFICULTY_LEVELS) {
    const raw = value[level];
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n)) base[level] = Math.max(0, Math.trunc(n));
  }
  return base;
}

/** Merge API `proposedPatch` keys onto baseline form state (amendment or new-park load). */
export function applyProposedPatchToFormFields(
  baseline: BikeParkFormFieldsState,
  patch: Record<string, unknown>,
): BikeParkFormFieldsState {
  const next: BikeParkFormFieldsState = { ...baseline };
  if (typeof patch.name === 'string') next.name = patch.name;
  if (typeof patch.description === 'string') next.description = patch.description;
  if (typeof patch.latitude === 'number' && Number.isFinite(patch.latitude)) {
    next.latitude = patch.latitude;
  }
  if (typeof patch.longitude === 'number' && Number.isFinite(patch.longitude)) {
    next.longitude = patch.longitude;
  }
  if (typeof patch.website === 'string') next.website = patch.website;
  if (patch.website === null) next.website = '';
  if (typeof patch.buyTicketUrl === 'string') next.buyTicketUrl = patch.buyTicketUrl;
  if (patch.buyTicketUrl === null) next.buyTicketUrl = '';
  if (patch.payment === 'paid' || patch.payment === 'free') {
    next.requiresPayment = patch.payment === 'paid';
  }
  if (typeof patch.logoUrl === 'string') next.logoUrl = patch.logoUrl;
  if (patch.logoUrl === null) next.logoUrl = '';
  if (typeof patch.pinLogoUrl === 'string') next.pinLogoUrl = patch.pinLogoUrl;
  if (patch.pinLogoUrl === null) next.pinLogoUrl = '';
  if (Array.isArray(patch.facilities)) next.facilities = parseFacilities(patch.facilities);
  if (patch.trailDifficultyCounts !== undefined) {
    next.trailDifficultyCounts = parseTrailCounts(patch.trailDifficultyCounts);
  }
  if (patch.openingHours !== undefined && patch.openingHours !== null) {
    if (isRecord(patch.openingHours)) {
      const oh = { ...next.openingHours };
      for (const day of [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ] as const) {
        const v = patch.openingHours[day];
        if (typeof v === 'string') oh[day] = v;
      }
      next.openingHours = oh;
    }
  }
  return next;
}

/** API-shaped opening hours record from form (trimmed, non-empty days only). */
export function openingHoursFormToComparableRecord(
  openingHours: BikeParkFormFieldsState['openingHours'],
): Record<string, string> {
  return openingHoursFormToPayloadRecord(openingHours);
}
