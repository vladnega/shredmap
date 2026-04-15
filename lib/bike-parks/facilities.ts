export const BIKE_PARK_FACILITY_SLUGS = [
  'bike_rental',
  'bike_mechanic',
  'food_drink',
  'toilets',
  'showers',
  'bike_wash',
  'first_aid',
  'coaching',
  'parking',
  'uplift_chair',
  'uplift_gondola',
  'uplift_shuttle',
  'ebike_allowed',
  'accommodation',
  'shop',
] as const;

export type BikeParkFacilitySlug = (typeof BIKE_PARK_FACILITY_SLUGS)[number];

export const BIKE_PARK_FACILITY_LABELS: Record<BikeParkFacilitySlug, string> = {
  bike_rental: 'Bike rental',
  bike_mechanic: 'Mechanic',
  food_drink: 'Food & drink',
  toilets: 'Toilets',
  showers: 'Showers',
  bike_wash: 'Bike wash',
  first_aid: 'First aid',
  coaching: 'Coaching',
  parking: 'Parking',
  uplift_chair: 'Uplift (chair)',
  uplift_gondola: 'Uplift (gondola)',
  uplift_shuttle: 'Uplift (shuttle)',
  ebike_allowed: 'E-bike allowed',
  accommodation: 'Accommodation',
  shop: 'Shop',
};

export const BIKE_PARK_FACILITY_OPTIONS = BIKE_PARK_FACILITY_SLUGS.map((slug) => ({
  slug,
  label: BIKE_PARK_FACILITY_LABELS[slug],
}));

const FACILITY_SLUG_SET = new Set<string>(BIKE_PARK_FACILITY_SLUGS);

export function isBikeParkFacilitySlug(value: string): value is BikeParkFacilitySlug {
  return FACILITY_SLUG_SET.has(value);
}

export function amenitiesToSelectedFacilities(
  amenities: Record<string, boolean> | null | undefined,
): BikeParkFacilitySlug[] {
  if (!amenities) {
    return [];
  }
  return BIKE_PARK_FACILITY_SLUGS.filter((slug) => amenities[slug] === true);
}

export function selectedFacilitiesToAmenities(
  selected: readonly BikeParkFacilitySlug[],
): Record<string, boolean> {
  const selectedSet = new Set(selected);
  const amenities: Record<string, boolean> = {};
  for (const slug of BIKE_PARK_FACILITY_SLUGS) {
    amenities[slug] = selectedSet.has(slug);
  }
  return amenities;
}
