import type { BikePark } from '@/lib/db/schema';
import { amenitiesToSelectedFacilities, type BikeParkFacilitySlug } from '@/lib/bike-parks/facilities';
import { htmlToPlainText } from '@/lib/bike-parks/description-text';
import {
  emptyOpeningHours,
  openingHoursDbToFormState,
  type OpeningHoursFormState,
} from '@/lib/bike-parks/opening-hours-form';
import {
  EMPTY_TRAIL_DIFFICULTY_COUNTS,
  type TrailDifficultyCounts,
} from '@/lib/bike-parks/trail-difficulties';

export const DEFAULT_BIKE_PARK_MAP_LAT = 51.058;
export const DEFAULT_BIKE_PARK_MAP_LNG = -0.161;

export type BikeParkFormFieldsState = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  website: string;
  buyTicketUrl: string;
  requiresPayment: boolean;
  logoUrl: string;
  pinLogoUrl: string;
  openingHours: OpeningHoursFormState;
  facilities: BikeParkFacilitySlug[];
  trailDifficultyCounts: TrailDifficultyCounts;
};

export function emptyTrailDifficultyCounts(): TrailDifficultyCounts {
  return { ...EMPTY_TRAIL_DIFFICULTY_COUNTS };
}

export function emptyBikeParkFormFields(): BikeParkFormFieldsState {
  return {
    name: '',
    description: '',
    latitude: DEFAULT_BIKE_PARK_MAP_LAT,
    longitude: DEFAULT_BIKE_PARK_MAP_LNG,
    website: '',
    buyTicketUrl: '',
    requiresPayment: false,
    logoUrl: '',
    pinLogoUrl: '',
    openingHours: emptyOpeningHours(),
    facilities: [],
    trailDifficultyCounts: emptyTrailDifficultyCounts(),
  };
}

export function bikeParkToFormFields(park: BikePark): BikeParkFormFieldsState {
  return {
    name: park.name,
    description: park.description ? htmlToPlainText(park.description) : '',
    latitude: park.latitude,
    longitude: park.longitude,
    website: park.primaryCtaUrl ?? '',
    buyTicketUrl: park.buyTicketUrl ?? '',
    requiresPayment: park.payment === 'paid',
    logoUrl: park.logoUrl ?? '',
    pinLogoUrl: park.pinLogoUrl ?? '',
    openingHours: openingHoursDbToFormState(park.openingHours),
    facilities: amenitiesToSelectedFacilities(park.amenities),
    trailDifficultyCounts: park.trailDifficultyCounts ?? emptyTrailDifficultyCounts(),
  };
}
