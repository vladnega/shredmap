import { OPENING_HOURS_DAYS } from '@/lib/bike-parks/opening-hours-form';
import type { BikeParkFormFieldsState } from '@/lib/bike-parks/park-form-state';
import { TRAIL_DIFFICULTY_LEVELS } from '@/lib/bike-parks/trail-difficulties';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Staff PATCH body from full form state (optional URL keys omitted when empty). */
export function buildBikeParkAdminPatchBody(state: BikeParkFormFieldsState): Record<string, unknown> {
  const trimmedName = state.name.trim();
  const trimmedDescription = state.description.trim();
  const trimmedWebsite = state.website.trim();
  const trimmedBuyTicketUrl = state.buyTicketUrl.trim();
  const trimmedLogoUrl = state.logoUrl.trim();
  const trimmedPinLogoUrl = state.pinLogoUrl.trim();
  const openingHoursEntries = OPENING_HOURS_DAYS.map(
    ({ key }) => [key, state.openingHours[key].trim()] as const,
  ).filter(([, value]) => value.length > 0);
  const openingHoursPayload =
    openingHoursEntries.length > 0 ? Object.fromEntries(openingHoursEntries) : null;

  return {
    name: trimmedName,
    description: trimmedDescription,
    latitude: state.latitude,
    longitude: state.longitude,
    ...(trimmedWebsite ? { website: trimmedWebsite } : {}),
    ...(trimmedBuyTicketUrl ? { buyTicketUrl: trimmedBuyTicketUrl } : {}),
    payment: state.requiresPayment ? 'paid' : 'free',
    ...(trimmedLogoUrl ? { logoUrl: trimmedLogoUrl } : {}),
    ...(trimmedPinLogoUrl ? { pinLogoUrl: trimmedPinLogoUrl } : {}),
    openingHours: openingHoursPayload,
    facilities: state.facilities,
    trailDifficultyCounts: state.trailDifficultyCounts,
  };
}

/** Full create-shaped payload for new park requests (trimmed strings; opening hours object). */
export function buildNewParkProposedPayloadFromForm(state: BikeParkFormFieldsState) {
  const openingHoursRecord = Object.fromEntries(
    OPENING_HOURS_DAYS.map(({ key }) => [key, state.openingHours[key].trim()] as const).filter(
      ([, value]) => value.length > 0,
    ),
  );
  return {
    name: state.name.trim(),
    description: state.description.trim(),
    latitude: state.latitude,
    longitude: state.longitude,
    website: state.website.trim(),
    buyTicketUrl: state.buyTicketUrl.trim(),
    payment: state.requiresPayment ? 'paid' : 'free',
    logoUrl: state.logoUrl.trim(),
    pinLogoUrl: state.pinLogoUrl.trim(),
    facilities: state.facilities,
    trailDifficultyCounts: state.trailDifficultyCounts,
    openingHours: openingHoursRecord,
  };
}

/** Sparse amendment patch; returns null if no changes. */
export function buildAmendmentProposedPatchFromForm(
  state: BikeParkFormFieldsState,
  initial: BikeParkFormFieldsState,
): Record<string, unknown> | null {
  const payloadBase = buildNewParkProposedPayloadFromForm(state);
  const proposedPatch: Record<string, unknown> = {};
  if (payloadBase.name !== initial.name) proposedPatch.name = payloadBase.name;
  if (payloadBase.description !== initial.description) {
    proposedPatch.description = payloadBase.description;
  }
  if (payloadBase.latitude !== initial.latitude) proposedPatch.latitude = payloadBase.latitude;
  if (payloadBase.longitude !== initial.longitude) proposedPatch.longitude = payloadBase.longitude;
  if (payloadBase.website !== initial.website) proposedPatch.website = payloadBase.website || null;
  if (payloadBase.buyTicketUrl !== initial.buyTicketUrl) {
    proposedPatch.buyTicketUrl = payloadBase.buyTicketUrl || null;
  }
  if (payloadBase.payment !== (initial.requiresPayment ? 'paid' : 'free')) {
    proposedPatch.payment = payloadBase.payment;
  }
  if (payloadBase.logoUrl !== initial.logoUrl) proposedPatch.logoUrl = payloadBase.logoUrl || null;
  if (payloadBase.pinLogoUrl !== initial.pinLogoUrl) {
    proposedPatch.pinLogoUrl = payloadBase.pinLogoUrl || null;
  }
  if (JSON.stringify(payloadBase.facilities) !== JSON.stringify(initial.facilities)) {
    proposedPatch.facilities = payloadBase.facilities;
  }
  if (
    JSON.stringify(payloadBase.trailDifficultyCounts) !==
    JSON.stringify(initial.trailDifficultyCounts)
  ) {
    proposedPatch.trailDifficultyCounts = payloadBase.trailDifficultyCounts;
  }
  const initialHours = Object.fromEntries(
    OPENING_HOURS_DAYS.map(({ key }) => [key, initial.openingHours[key].trim()] as const).filter(
      ([, v]) => v.length > 0,
    ),
  );
  if (JSON.stringify(payloadBase.openingHours) !== JSON.stringify(initialHours)) {
    proposedPatch.openingHours = payloadBase.openingHours;
  }
  if (Object.keys(proposedPatch).length === 0) return null;
  return proposedPatch;
}

/** Normalize staff-editable park request patch before PATCH. */
export function normalizeProposedPatchForSave(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      key === 'name' ||
      key === 'description' ||
      key === 'website' ||
      key === 'buyTicketUrl' ||
      key === 'logoUrl' ||
      key === 'pinLogoUrl'
    ) {
      next[key] = typeof value === 'string' ? value.trim() : value;
      continue;
    }
    if (key === 'latitude' || key === 'longitude') {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(n)) next[key] = n;
      continue;
    }
    if (key === 'payment') {
      next[key] = value === 'paid' ? 'paid' : 'free';
      continue;
    }
    if (key === 'facilities') {
      if (Array.isArray(value)) {
        next[key] = value.filter((entry): entry is string => typeof entry === 'string');
      }
      continue;
    }
    if (key === 'openingHours') {
      if (isRecord(value)) {
        const normalized: Record<string, string> = {};
        for (const day of OPENING_HOURS_DAYS) {
          const dayValue = value[day.key];
          if (typeof dayValue === 'string' && dayValue.trim().length > 0) {
            normalized[day.key] = dayValue.trim();
          }
        }
        next[key] = normalized;
      }
      continue;
    }
    if (key === 'trailDifficultyCounts') {
      if (isRecord(value)) {
        const normalized: Record<string, number> = {};
        for (const level of TRAIL_DIFFICULTY_LEVELS) {
          const count = value[level];
          const parsed = typeof count === 'number' ? count : Number(count);
          if (Number.isFinite(parsed)) {
            normalized[level] = Math.max(0, Math.trunc(parsed));
          }
        }
        next[key] = normalized;
      }
      continue;
    }
    next[key] = value;
  }
  return next;
}

/** Persist park request `proposedPatch` from full editor state (staff review). */
export function buildProposedPatchToPersistForParkRequest(
  form: BikeParkFormFieldsState,
  baseline: BikeParkFormFieldsState,
  requestType: 'new_park' | 'amendment',
  /** Used when an amendment produces no diff vs baseline (keep prior payload valid for Zod). */
  fallbackPatch: Record<string, unknown>,
): Record<string, unknown> {
  if (requestType === 'new_park') {
    return normalizeProposedPatchForSave(
      buildNewParkProposedPayloadFromForm(form) as Record<string, unknown>,
    );
  }
  const sparse = buildAmendmentProposedPatchFromForm(form, baseline);
  if (sparse && Object.keys(sparse).length > 0) {
    return normalizeProposedPatchForSave(sparse as Record<string, unknown>);
  }
  return normalizeProposedPatchForSave(fallbackPatch);
}
