import { BIKE_PARK_FACILITY_OPTIONS } from '@/lib/bike-parks/facilities';
import { OPENING_HOURS_DAYS } from '@/lib/bike-parks/opening-hours-form';
import { TRAIL_DIFFICULTY_LABELS, TRAIL_DIFFICULTY_LEVELS } from '@/lib/bike-parks/trail-difficulties';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSentenceLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value) && value.length === 0) return '—';
  return JSON.stringify(value);
}

export function formatCoordinate(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return toDisplay(value);
  }
  return value.toFixed(6);
}

export function formatPayment(value: unknown): string {
  if (value === 'paid') return 'Paid';
  if (value === 'free') return 'Free';
  return toDisplay(value);
}

export function formatFacilities(value: unknown): string {
  if (!Array.isArray(value)) return toDisplay(value);
  if (value.length === 0) return '—';

  const labelsBySlug: Map<string, string> = new Map(
    BIKE_PARK_FACILITY_OPTIONS.map((option) => [option.slug, option.label]),
  );
  return value
    .map((entry) => {
      if (typeof entry !== 'string') return null;
      return labelsBySlug.get(entry) ?? toSentenceLabel(entry);
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(', ');
}

export function formatTrailDifficultyCounts(value: unknown): string {
  if (!isRecord(value)) return toDisplay(value);
  const parts = TRAIL_DIFFICULTY_LEVELS.map((level) => {
    const count = value[level];
    if (typeof count !== 'number') return null;
    return `${TRAIL_DIFFICULTY_LABELS[level]}: ${count}`;
  }).filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' | ') : '—';
}

export function formatOpeningHours(value: unknown): string {
  if (!isRecord(value)) return toDisplay(value);
  const parts = OPENING_HOURS_DAYS.map((day) => {
    const dayValue = value[day.key];
    if (typeof dayValue !== 'string' || dayValue.trim().length === 0) return null;
    return `${day.label}: ${dayValue.trim()}`;
  }).filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' | ') : '—';
}

export function formatFieldValue(key: string, value: unknown): string {
  if (key === 'latitude' || key === 'longitude') return formatCoordinate(value);
  if (key === 'payment') return formatPayment(value);
  if (key === 'facilities') return formatFacilities(value);
  if (key === 'openingHours') return formatOpeningHours(value);
  if (key === 'trailDifficultyCounts') return formatTrailDifficultyCounts(value);
  return toDisplay(value);
}

export function valuesDiffer(key: string, prevValue: unknown, nextValue: unknown): boolean {
  if (key === 'facilities') {
    const prev = Array.isArray(prevValue)
      ? [...prevValue].filter((entry): entry is string => typeof entry === 'string').sort()
      : [];
    const next = Array.isArray(nextValue)
      ? [...nextValue].filter((entry): entry is string => typeof entry === 'string').sort()
      : [];
    return JSON.stringify(prev) !== JSON.stringify(next);
  }
  if (key === 'openingHours' || key === 'trailDifficultyCounts') {
    const prev = isRecord(prevValue) ? prevValue : {};
    const next = isRecord(nextValue) ? nextValue : {};
    return JSON.stringify(prev) !== JSON.stringify(next);
  }
  return formatFieldValue(key, prevValue) !== formatFieldValue(key, nextValue);
}

export function bikeParkPatchFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    name: 'Park name',
    description: 'Description',
    latitude: 'Latitude',
    longitude: 'Longitude',
    website: 'Website',
    buyTicketUrl: 'Buy ticket URL',
    payment: 'Pricing',
    logoUrl: 'Logo',
    pinLogoUrl: 'Pin logo',
    facilities: 'Facilities',
    openingHours: 'Opening hours',
    trailDifficultyCounts: 'Trail difficulty counts',
  };
  return labels[key] ?? toSentenceLabel(key);
}
