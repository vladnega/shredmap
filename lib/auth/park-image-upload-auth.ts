import 'server-only';

import {
  requireBikeParkReviewAuthor,
  type BikeParkReviewAuth,
} from '@/lib/auth/bike-park-review-auth';

/**
 * Ensures requester may upload park logo/pin images (member, admin, or moderator).
 * Delegates to the same check as park review authors.
 */
export async function requireParkImageUploadAuthor(): Promise<BikeParkReviewAuth> {
  return requireBikeParkReviewAuthor();
}
