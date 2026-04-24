import { htmlToPlainText } from '@/lib/bike-parks/description-text';
import { amenitiesToSelectedFacilities } from '@/lib/bike-parks/facilities';
import type { BikePark } from '@/lib/db/schema';

/**
 * Map API patch keys (Zod bike park create/patch) to baseline values from a `BikePark` row.
 * Used for amendment diffs so `website`/`facilities` resolve correctly vs DB columns.
 */
export function getBaselineValueForPatchKey(park: BikePark, key: string): unknown {
  switch (key) {
    case 'name':
      return park.name;
    case 'description':
      return park.description ? htmlToPlainText(park.description) : '';
    case 'latitude':
      return park.latitude;
    case 'longitude':
      return park.longitude;
    case 'website':
      return park.primaryCtaUrl ?? '';
    case 'buyTicketUrl':
      return park.buyTicketUrl ?? '';
    case 'payment':
      return park.payment === 'paid' ? 'paid' : 'free';
    case 'logoUrl':
      return park.logoUrl ?? '';
    case 'pinLogoUrl':
      return park.pinLogoUrl ?? '';
    case 'facilities':
      return amenitiesToSelectedFacilities(park.amenities);
    case 'openingHours':
      return park.openingHours;
    case 'trailDifficultyCounts':
      return park.trailDifficultyCounts;
    default:
      return Reflect.get(park as object, key);
  }
}
