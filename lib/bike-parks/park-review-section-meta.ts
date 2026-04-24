import {
  formatCoordinate,
  formatFacilities,
  formatFieldValue,
  formatOpeningHours,
  formatPayment,
  formatTrailDifficultyCounts,
} from '@/lib/bike-parks/park-request-field-format';
import { openingHoursFormToComparableRecord } from '@/lib/bike-parks/park-request-patch-form';
import type { BikeParkFormFieldsState } from '@/lib/bike-parks/park-form-state';

export type BikeParkReviewSectionId =
  | 'name'
  | 'description'
  | 'location'
  | 'website'
  | 'buyTicketUrl'
  | 'payment'
  | 'logoUrl'
  | 'pinLogoUrl'
  | 'openingHours'
  | 'trailDifficultyCounts'
  | 'facilities';

export const BIKE_PARK_REVIEW_SECTION_ORDER: BikeParkReviewSectionId[] = [
  'name',
  'description',
  'location',
  'website',
  'buyTicketUrl',
  'payment',
  'logoUrl',
  'pinLogoUrl',
  'openingHours',
  'trailDifficultyCounts',
  'facilities',
];

export function bikeParkReviewSectionLabel(id: BikeParkReviewSectionId): string {
  const labels: Record<BikeParkReviewSectionId, string> = {
    name: 'Park name',
    description: 'Description',
    location: 'Location',
    website: 'Website',
    buyTicketUrl: 'Buy ticket URL',
    payment: 'Pricing',
    logoUrl: 'Logo URL',
    pinLogoUrl: 'Pin logo URL',
    openingHours: 'Opening hours',
    trailDifficultyCounts: 'Trail difficulty counts',
    facilities: 'Facilities',
  };
  return labels[id];
}

function paymentApiValue(state: BikeParkFormFieldsState): 'paid' | 'free' {
  return state.requiresPayment ? 'paid' : 'free';
}

function trailCountsComparable(state: BikeParkFormFieldsState): Record<string, number> {
  return { ...state.trailDifficultyCounts };
}

export type ReviewSectionPresentation = {
  hasPreviousValue: boolean;
  hasDifference: boolean;
  /** True for new-park proposals (all sections show the “new” dot). */
  isNewProposal: boolean;
  previousDisplay: string;
};

export function getReviewSectionPresentation(
  sectionId: BikeParkReviewSectionId,
  requestType: 'new_park' | 'amendment',
  baseline: BikeParkFormFieldsState,
  value: BikeParkFormFieldsState,
): ReviewSectionPresentation {
  const isNewProposal = requestType === 'new_park';
  const hasPreviousValue = !isNewProposal;

  let hasDifference = false;
  let prevRaw: unknown;

  switch (sectionId) {
    case 'name':
      prevRaw = baseline.name;
      hasDifference = baseline.name.trim() !== value.name.trim();
      break;
    case 'description':
      prevRaw = baseline.description;
      hasDifference = baseline.description.trim() !== value.description.trim();
      break;
    case 'location':
      prevRaw = { latitude: baseline.latitude, longitude: baseline.longitude };
      hasDifference =
        baseline.latitude !== value.latitude || baseline.longitude !== value.longitude;
      break;
    case 'website':
      prevRaw = baseline.website.trim();
      hasDifference = baseline.website.trim() !== value.website.trim();
      break;
    case 'buyTicketUrl':
      prevRaw = baseline.buyTicketUrl.trim();
      hasDifference = baseline.buyTicketUrl.trim() !== value.buyTicketUrl.trim();
      break;
    case 'payment':
      prevRaw = paymentApiValue(baseline);
      hasDifference = paymentApiValue(baseline) !== paymentApiValue(value);
      break;
    case 'logoUrl':
      prevRaw = baseline.logoUrl.trim();
      hasDifference = baseline.logoUrl.trim() !== value.logoUrl.trim();
      break;
    case 'pinLogoUrl':
      prevRaw = baseline.pinLogoUrl.trim();
      hasDifference = baseline.pinLogoUrl.trim() !== value.pinLogoUrl.trim();
      break;
    case 'openingHours': {
      const prev = openingHoursFormToComparableRecord(baseline.openingHours);
      const next = openingHoursFormToComparableRecord(value.openingHours);
      prevRaw = prev;
      hasDifference = JSON.stringify(prev) !== JSON.stringify(next);
      break;
    }
    case 'trailDifficultyCounts': {
      const prev = trailCountsComparable(baseline);
      const next = trailCountsComparable(value);
      prevRaw = prev;
      hasDifference = JSON.stringify(prev) !== JSON.stringify(next);
      break;
    }
    case 'facilities': {
      const prevSorted = [...baseline.facilities].sort();
      const nextSorted = [...value.facilities].sort();
      prevRaw = baseline.facilities;
      hasDifference = JSON.stringify(prevSorted) !== JSON.stringify(nextSorted);
      break;
    }
    default:
      prevRaw = null;
  }

  let previousDisplay = '—';
  if (sectionId === 'location' && hasPreviousValue) {
    previousDisplay = `lat ${formatCoordinate(baseline.latitude)}, lng ${formatCoordinate(baseline.longitude)}`;
  } else if (sectionId === 'openingHours' && hasPreviousValue) {
    previousDisplay = formatOpeningHours(openingHoursFormToComparableRecord(baseline.openingHours));
  } else if (sectionId === 'trailDifficultyCounts' && hasPreviousValue) {
    previousDisplay = formatTrailDifficultyCounts(trailCountsComparable(baseline));
  } else if (sectionId === 'facilities' && hasPreviousValue) {
    previousDisplay = formatFacilities(baseline.facilities);
  } else if (sectionId === 'payment' && hasPreviousValue) {
    previousDisplay = formatPayment(paymentApiValue(baseline));
  } else if (hasPreviousValue) {
    const key =
      sectionId === 'name'
        ? 'name'
        : sectionId === 'description'
          ? 'description'
          : sectionId === 'website'
            ? 'website'
            : sectionId === 'buyTicketUrl'
              ? 'buyTicketUrl'
              : sectionId === 'logoUrl'
                ? 'logoUrl'
                : 'pinLogoUrl';
    previousDisplay = formatFieldValue(key, prevRaw);
  }

  return {
    hasPreviousValue,
    hasDifference,
    isNewProposal,
    previousDisplay,
  };
}

/** Dot style: new proposals all emerald; amendments show orange when changed vs live park. */
export function reviewDotClass(meta: ReviewSectionPresentation): string {
  if (meta.isNewProposal) return 'h-2 w-2 shrink-0 rounded-full bg-emerald-400';
  if (meta.hasDifference) return 'h-2 w-2 shrink-0 rounded-full bg-orange-400';
  return 'h-2 w-2 shrink-0 rounded-full bg-transparent';
}
