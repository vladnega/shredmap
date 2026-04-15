import 'server-only';

import { withAuth } from '@workos-inc/authkit-nextjs';
import { collectWorkOsRoleSlugsForUser } from '@/lib/auth/bike-park-staff';
import { userCanManageBikeParks } from '@/lib/auth/bike-park-staff-roles';

/** For RSC: true if signed-in user may manage bike parks. */
export async function isBikeParkStaffMember(): Promise<boolean> {
  const auth = await withAuth();
  if (!auth.user) {
    return false;
  }
  const roleSet = new Set<string>(auth.roles ?? (auth.role ? [auth.role] : []));
  const membershipSlugs = await collectWorkOsRoleSlugsForUser(auth.user.id);
  for (const s of membershipSlugs) {
    roleSet.add(s);
  }
  return userCanManageBikeParks(roleSet);
}
