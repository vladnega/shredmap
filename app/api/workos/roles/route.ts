import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs';
import type { OrganizationMembership } from '@workos-inc/node';

type WorkOsRolesResponse = { roles: string[]; permissions: string[] };

export async function GET() {
  const auth = await withAuth({ ensureSignedIn: true });
  const workos = getWorkOS();

  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: auth.user.id,
    statuses: ['active', 'inactive', 'pending'],
  });

  const membershipRows: OrganizationMembership[] = await memberships.autoPagination();
  const roleSet = new Set<string>(auth.roles ?? (auth.role ? [auth.role] : []));

  for (const membership of membershipRows) {
    if (membership.role?.slug) {
      roleSet.add(membership.role.slug);
    }

    for (const role of membership.roles ?? []) {
      if (role.slug) {
        roleSet.add(role.slug);
      }
    }
  }

  const body: WorkOsRolesResponse = {
    roles: Array.from(roleSet),
    permissions: auth.permissions ?? [],
  };

  return Response.json(body);
}
