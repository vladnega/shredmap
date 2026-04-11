'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  organizations,
  organizationMembers,
  activityLogs,
  type NewUser,
  type NewOrganization,
  type NewOrganizationMember,
  type NewActivityLog,
  ActivityType,
  invitations,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser, getUserWithOrganization } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';

async function logActivity(
  organizationId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (organizationId === null || organizationId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    organizationId,
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithOrg = await db
    .select({
      user: users,
      organization: organizations,
    })
    .from(users)
    .leftJoin(organizationMembers, eq(users.id, organizationMembers.userId))
    .leftJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithOrg.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  const { user: foundUser, organization: foundOrganization } = userWithOrg[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password,
    };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundOrganization?.id, foundUser.id, ActivityType.SIGN_IN),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    redirect(redirectTo);
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, inviteId } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner',
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password,
    };
  }

  let organizationId: number;
  let userRole: string;
  let createdOrganization: typeof organizations.$inferSelect | null = null;

  if (inviteId) {
    const inviteNumeric = parseInt(inviteId, 10);
    if (Number.isNaN(inviteNumeric)) {
      return { error: 'Invalid invitation.', email, password };
    }
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, inviteNumeric),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (invitation) {
      organizationId = invitation.organizationId;
      userRole = invitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      await logActivity(
        organizationId,
        createdUser.id,
        ActivityType.ACCEPT_INVITATION
      );

      [createdOrganization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    const newOrganization: NewOrganization = {
      name: `${email}'s workspace`,
    };

    [createdOrganization] = await db
      .insert(organizations)
      .values(newOrganization)
      .returning();

    if (!createdOrganization) {
      return {
        error: 'Failed to create organization. Please try again.',
        email,
        password,
      };
    }

    organizationId = createdOrganization.id;
    userRole = 'owner';

    await logActivity(
      organizationId,
      createdUser.id,
      ActivityType.CREATE_ORGANIZATION
    );
  }

  const newOrganizationMember: NewOrganizationMember = {
    userId: createdUser.id,
    organizationId,
    role: userRole,
  };

  await Promise.all([
    db.insert(organizationMembers).values(newOrganizationMember),
    logActivity(organizationId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser),
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    redirect(redirectTo);
  }

  redirect('/dashboard');
});

export async function signOut() {
  const user = await getUser();
  if (user) {
    const userWithOrg = await getUserWithOrganization(user.id);
    await logActivity(userWithOrg?.organizationId, user.id, ActivityType.SIGN_OUT);
  }
  (await cookies()).delete('session');

  const { isWorkOsConfigured } = await import('@/lib/auth/workos-env');
  if (isWorkOsConfigured()) {
    const { signOut: workOsSignOut } = await import(
      '@workos-inc/authkit-nextjs'
    );
    await workOsSignOut();
  }
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.',
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.',
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithOrg = await getUserWithOrganization(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(
        userWithOrg?.organizationId,
        user.id,
        ActivityType.UPDATE_PASSWORD
      ),
    ]);

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.',
      };
    }

    const userWithOrg = await getUserWithOrganization(user.id);

    await logActivity(
      userWithOrg?.organizationId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
      })
      .where(eq(users.id, user.id));

    if (userWithOrg?.organizationId) {
      await db
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, user.id),
            eq(organizationMembers.organizationId, userWithOrg.organizationId)
          )
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithOrg = await getUserWithOrganization(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(
        userWithOrg?.organizationId,
        user.id,
        ActivityType.UPDATE_ACCOUNT
      ),
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeOrganizationMemberSchema = z.object({
  memberId: z.coerce.number(),
});

export const removeOrganizationMember = validatedActionWithUser(
  removeOrganizationMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithOrg = await getUserWithOrganization(user.id);

    if (!userWithOrg?.organizationId) {
      return { error: 'User is not part of an organization' };
    }

    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, userWithOrg.organizationId)
        )
      );

    await logActivity(
      userWithOrg.organizationId,
      user.id,
      ActivityType.REMOVE_ORGANIZATION_MEMBER
    );

    return { success: 'Member removed successfully' };
  }
);

const inviteOrganizationMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner']),
});

export const inviteOrganizationMember = validatedActionWithUser(
  inviteOrganizationMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithOrg = await getUserWithOrganization(user.id);

    if (!userWithOrg?.organizationId) {
      return { error: 'User is not part of an organization' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(organizationMembers, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(organizationMembers.organizationId, userWithOrg.organizationId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this organization' };
    }

    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.organizationId, userWithOrg.organizationId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    await db.insert(invitations).values({
      organizationId: userWithOrg.organizationId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending',
    });

    await logActivity(
      userWithOrg.organizationId,
      user.id,
      ActivityType.INVITE_ORGANIZATION_MEMBER
    );

    return { success: 'Invitation created successfully' };
  }
);
