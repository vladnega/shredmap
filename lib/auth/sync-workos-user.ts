import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { randomBytes } from 'crypto';

function nameFromWorkOsUser(wu: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}) {
  const n = [wu.firstName, wu.lastName].filter(Boolean).join(' ').trim();
  return n.length > 0 ? n : null;
}

/**
 * Ensures a local `users` row exists for the WorkOS user (reviews, roles, org tooling).
 * Links by `work_os_user_id`, or upgrades an existing email row when safe.
 */
export async function syncWorkOsUserToDatabase(wu: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const [existingByWorkOs] = await db
    .select()
    .from(users)
    .where(eq(users.workOsUserId, wu.id))
    .limit(1);

  if (existingByWorkOs) {
    await db
      .update(users)
      .set({
        email: wu.email,
        name: nameFromWorkOsUser(wu),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingByWorkOs.id));
    return;
  }

  const [existingByEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, wu.email))
    .limit(1);

  if (existingByEmail) {
    if (existingByEmail.workOsUserId && existingByEmail.workOsUserId !== wu.id) {
      console.warn(
        `[syncWorkOsUser] Email ${wu.email} already linked to another WorkOS user.`
      );
      return;
    }
    if (!existingByEmail.workOsUserId) {
      await db
        .update(users)
        .set({
          workOsUserId: wu.id,
          name: nameFromWorkOsUser(wu) ?? existingByEmail.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByEmail.id));
      return;
    }
    return;
  }

  const placeholderHash = await hashPassword(
    `workos:${wu.id}:${randomBytes(16).toString('hex')}`
  );

  await db.insert(users).values({
    email: wu.email,
    name: nameFromWorkOsUser(wu),
    workOsUserId: wu.id,
    passwordHash: placeholderHash,
    role: 'member',
  });
}
