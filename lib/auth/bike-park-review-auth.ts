import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { withAuth } from '@workos-inc/authkit-nextjs';

import { collectWorkOsRoleSlugsForUser } from '@/lib/auth/bike-park-staff';
import { userCanWriteBikeParkReviews } from '@/lib/auth/bike-park-review-roles';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

export type BikeParkReviewAuth =
  | {
      ok: true;
      appUserId: number;
      workOsUserId: string;
      roleSlugs: Set<string>;
    }
  | { ok: false; response: Response };

/**
 * Ensures requester is signed in and has one of: member, admin, moderator.
 * Also resolves the local users.id for review ownership/upsert.
 */
export async function requireBikeParkReviewAuthor(): Promise<BikeParkReviewAuth> {
  const auth = await withAuth();
  if (!auth.user) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const roleSet = new Set<string>(auth.roles ?? (auth.role ? [auth.role] : []));
  const membershipSlugs = await collectWorkOsRoleSlugsForUser(auth.user.id);
  for (const slug of membershipSlugs) {
    roleSet.add(slug);
  }

  if (!userCanWriteBikeParkReviews(roleSet)) {
    return {
      ok: false,
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  const localUserRows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.workOsUserId, auth.user.id), isNull(users.deletedAt)))
    .limit(1);
  const localUser = localUserRows[0];

  if (!localUser) {
    return {
      ok: false,
      response: Response.json(
        { error: 'User record is missing. Sign out and sign in again.' },
        { status: 409 },
      ),
    };
  }

  return {
    ok: true,
    appUserId: localUser.id,
    workOsUserId: auth.user.id,
    roleSlugs: roleSet,
  };
}
