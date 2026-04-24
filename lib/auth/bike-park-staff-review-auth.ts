import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { requireBikeParkStaff } from '@/lib/auth/bike-park-staff';

export type BikeParkStaffReviewAuth =
  | {
      ok: true;
      appUserId: number;
      workOsUserId: string;
      roleSlugs: Set<string>;
    }
  | { ok: false; response: Response };

export async function requireBikeParkStaffReviewer(): Promise<BikeParkStaffReviewAuth> {
  const auth = await requireBikeParkStaff();
  if (!auth.ok) {
    return auth;
  }

  const localUserRows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.workOsUserId, auth.workOsUserId), isNull(users.deletedAt)))
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
    workOsUserId: auth.workOsUserId,
    roleSlugs: auth.roleSlugs,
  };
}
