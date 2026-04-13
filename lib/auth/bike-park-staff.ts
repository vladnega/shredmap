import 'server-only';

import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs';
import type { OrganizationMembership } from '@workos-inc/node';

import { userCanManageBikeParks } from '@/lib/auth/bike-park-staff-roles';

export { BIKE_PARK_STAFF_ROLE_SLUGS, userCanManageBikeParks } from '@/lib/auth/bike-park-staff-roles';

function addMembershipRoleSlugs(
  memberships: readonly OrganizationMembership[],
  into: Set<string>,
) {
  for (const membership of memberships) {
    if (membership.role?.slug) {
      into.add(membership.role.slug);
    }
    for (const role of membership.roles ?? []) {
      if (role.slug) {
        into.add(role.slug);
      }
    }
  }
}

/**
 * Resolves WorkOS role slugs for the current session (session claims + org memberships).
 * Call only from Route Handlers / Server Actions after verifying `withAuth()` has a user.
 */
export async function collectWorkOsRoleSlugsForUser(workOsUserId: string): Promise<Set<string>> {
  const workos = getWorkOS();
  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: workOsUserId,
    statuses: ['active', 'inactive', 'pending'],
  });
  const membershipRows: OrganizationMembership[] = await memberships.autoPagination();
  const roleSet = new Set<string>();
  addMembershipRoleSlugs(membershipRows, roleSet);
  return roleSet;
}

export type BikeParkStaffAuth =
  | { ok: true; workOsUserId: string; roleSlugs: Set<string> }
  | { ok: false; response: Response };

/**
 * Ensures the requester is signed in and has admin or moderator (WorkOS slug).
 * Use at the start of every bike park mutating API route.
 */
export async function requireBikeParkStaff(): Promise<BikeParkStaffAuth> {
  const auth = await withAuth();
  if (!auth.user) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const roleSet = new Set<string>(auth.roles ?? (auth.role ? [auth.role] : []));
  const membershipSlugs = await collectWorkOsRoleSlugsForUser(auth.user.id);
  for (const s of membershipSlugs) {
    roleSet.add(s);
  }

  if (!userCanManageBikeParks(roleSet)) {
    return {
      ok: false,
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, workOsUserId: auth.user.id, roleSlugs: roleSet };
}
