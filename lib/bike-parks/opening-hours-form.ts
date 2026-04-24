import type { BikePark } from '@/lib/db/schema';

export const OPENING_HOURS_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export type OpeningHoursDayKey = (typeof OPENING_HOURS_DAYS)[number]['key'];

export type OpeningHoursFormState = Record<OpeningHoursDayKey, string>;

export function emptyOpeningHours(): OpeningHoursFormState {
  return {
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  };
}

export function openingHoursDbToFormState(
  openingHours: BikePark['openingHours'],
): OpeningHoursFormState {
  const initial = emptyOpeningHours();
  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) {
    return initial;
  }
  for (const day of OPENING_HOURS_DAYS) {
    const value = Reflect.get(openingHours, day.key);
    if (typeof value === 'string') {
      initial[day.key] = value;
    }
  }
  return initial;
}

/** API payload: only days with non-empty trimmed strings. */
export function openingHoursFormToPayloadRecord(
  openingHours: OpeningHoursFormState,
): Record<string, string> {
  return Object.fromEntries(
    OPENING_HOURS_DAYS.map(({ key }) => [key, openingHours[key].trim()] as const).filter(
      ([, value]) => value.length > 0,
    ),
  );
}
