/** Role slugs that may create/update/delete bike parks (must match WorkOS dashboard). */
export const BIKE_PARK_STAFF_ROLE_SLUGS = ['admin', 'moderator'] as const;

export function userCanManageBikeParks(roleSlugs: ReadonlySet<string>): boolean {
  for (const slug of BIKE_PARK_STAFF_ROLE_SLUGS) {
    if (roleSlugs.has(slug)) {
      return true;
    }
  }
  return false;
}
