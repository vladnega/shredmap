/** Role slugs allowed to create/update park reviews (must match WorkOS dashboard). */
export const BIKE_PARK_REVIEW_ROLE_SLUGS = [
  'member',
  'admin',
  'moderator',
] as const;

export function userCanWriteBikeParkReviews(roleSlugs: ReadonlySet<string>): boolean {
  for (const slug of BIKE_PARK_REVIEW_ROLE_SLUGS) {
    if (roleSlugs.has(slug)) {
      return true;
    }
  }
  return false;
}
