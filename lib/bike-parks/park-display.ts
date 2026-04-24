import {
  BIKE_PARK_FACILITY_LABELS,
  isBikeParkFacilitySlug,
} from '@/lib/bike-parks/facilities';

export function amenityList(amenities: Record<string, boolean> | null | undefined) {
  if (!amenities) return [];
  return Object.entries(amenities).flatMap(([key, enabled]) => {
    if (!enabled) return [];
    return [
      isBikeParkFacilitySlug(key)
        ? BIKE_PARK_FACILITY_LABELS[key]
        : key.replace(/_/g, ' '),
    ];
  });
}

const orderedDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function formatOpeningHours(
  openingHours: unknown,
): Array<{ label: string; hours: string }> {
  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) {
    return [];
  }
  const entries = Object.entries(openingHours)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([day, value]) => ({
      day,
      hours: value.trim(),
    }));
  if (entries.length === 0) {
    return [];
  }
  const orderIndex = new Map<string, number>(
    orderedDays.map((day, index) => [day, index]),
  );
  entries.sort((a, b) => {
    const aIndex = orderIndex.get(a.day.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.day.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.day.localeCompare(b.day);
  });
  return entries.map(({ day, hours }) => ({
    label: day.charAt(0).toUpperCase() + day.slice(1),
    hours,
  }));
}
