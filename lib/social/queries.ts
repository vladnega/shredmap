import { randomBytes } from 'crypto';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  bikeParks,
  friendInvitations,
  friendships,
  mateInviteLinks,
  ridePlans,
  users,
  type User,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export function canonicalFriendPair(a: number, b: number): { low: number; high: number } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmailForInvite(email: string): Promise<User | null> {
  const normalized = normalizeEmail(email);
  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        sql`lower(${users.email}) = ${normalized}`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

async function friendshipRowExists(low: number, high: number): Promise<boolean> {
  const rows = await db
    .select({ userLowId: friendships.userLowId })
    .from(friendships)
    .where(and(eq(friendships.userLowId, low), eq(friendships.userHighId, high)))
    .limit(1);
  return rows.length > 0;
}

export async function areUsersMates(a: number, b: number): Promise<boolean> {
  const { low, high } = canonicalFriendPair(a, b);
  return friendshipRowExists(low, high);
}

async function hasPendingInviteBetween(
  userIdA: number,
  userIdB: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: friendInvitations.id })
    .from(friendInvitations)
    .where(
      and(eq(friendInvitations.status, 'pending'), or(
        and(
          eq(friendInvitations.inviterUserId, userIdA),
          eq(friendInvitations.inviteeUserId, userIdB),
        ),
        and(
          eq(friendInvitations.inviterUserId, userIdB),
          eq(friendInvitations.inviteeUserId, userIdA),
        ),
      )),
    )
    .limit(1);
  return rows.length > 0;
}

export type CreateInviteResult =
  | { ok: true; invitation: typeof friendInvitations.$inferSelect }
  | { ok: false; code: 'self' | 'not_found' | 'already_mates' | 'pending_exists' };

export async function createMateInvite(
  inviterUserId: number,
  inviteeEmail: string,
): Promise<CreateInviteResult> {
  const invitee = await findUserByEmailForInvite(inviteeEmail);
  if (!invitee) {
    return { ok: false, code: 'not_found' };
  }
  if (invitee.id === inviterUserId) {
    return { ok: false, code: 'self' };
  }

  const { low, high } = canonicalFriendPair(inviterUserId, invitee.id);
  if (await friendshipRowExists(low, high)) {
    return { ok: false, code: 'already_mates' };
  }
  if (await hasPendingInviteBetween(inviterUserId, invitee.id)) {
    return { ok: false, code: 'pending_exists' };
  }

  const inserted = await db
    .insert(friendInvitations)
    .values({
      inviterUserId,
      inviteeUserId: invitee.id,
      status: 'pending',
    })
    .returning();

  const row = inserted[0];
  if (!row) {
    return { ok: false, code: 'pending_exists' };
  }
  return { ok: true, invitation: row };
}

export type InvitationRow = {
  id: number;
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
  counterparty: { id: number; name: string | null; email: string };
};

export async function listIncomingInvitations(
  inviteeUserId: number,
): Promise<InvitationRow[]> {
  const rows = await db
    .select({
      id: friendInvitations.id,
      status: friendInvitations.status,
      createdAt: friendInvitations.createdAt,
      respondedAt: friendInvitations.respondedAt,
      otherId: users.id,
      otherName: users.name,
      otherEmail: users.email,
    })
    .from(friendInvitations)
    .innerJoin(users, eq(friendInvitations.inviterUserId, users.id))
    .where(
      and(
        eq(friendInvitations.inviteeUserId, inviteeUserId),
        eq(friendInvitations.status, 'pending'),
      ),
    )
    .orderBy(desc(friendInvitations.createdAt));

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    counterparty: {
      id: r.otherId,
      name: r.otherName,
      email: r.otherEmail,
    },
  }));
}

export async function listOutgoingInvitations(
  inviterUserId: number,
): Promise<InvitationRow[]> {
  const rows = await db
    .select({
      id: friendInvitations.id,
      status: friendInvitations.status,
      createdAt: friendInvitations.createdAt,
      respondedAt: friendInvitations.respondedAt,
      otherId: users.id,
      otherName: users.name,
      otherEmail: users.email,
    })
    .from(friendInvitations)
    .innerJoin(users, eq(friendInvitations.inviteeUserId, users.id))
    .where(
      and(
        eq(friendInvitations.inviterUserId, inviterUserId),
        eq(friendInvitations.status, 'pending'),
      ),
    )
    .orderBy(desc(friendInvitations.createdAt));

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
    counterparty: {
      id: r.otherId,
      name: r.otherName,
      email: r.otherEmail,
    },
  }));
}

export async function listAcceptedFriends(userId: number) {
  const rows = await db
    .select({
      userLowId: friendships.userLowId,
      userHighId: friendships.userHighId,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .where(
      or(
        eq(friendships.userLowId, userId),
        eq(friendships.userHighId, userId),
      ),
    )
    .orderBy(desc(friendships.createdAt));

  const otherIds = rows.map((r) =>
    r.userLowId === userId ? r.userHighId : r.userLowId,
  );
  if (otherIds.length === 0) {
    return [];
  }

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, otherIds));

  const byId = new Map(userRows.map((u) => [u.id, u]));
  return rows
    .map((r) => {
      const oid = r.userLowId === userId ? r.userHighId : r.userLowId;
      const u = byId.get(oid);
      if (!u) return null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        friendsSince: r.createdAt,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export async function getFriendUserIds(userId: number): Promise<number[]> {
  const friends = await listAcceptedFriends(userId);
  return friends.map((f) => f.id);
}

export type InviteActionResult =
  | { ok: true }
  | { ok: false; code: 'not_found' | 'forbidden' | 'bad_state' };

export async function acceptMateInvitation(
  invitationId: number,
  inviteeUserId: number,
): Promise<InviteActionResult> {
  const rows = await db
    .select()
    .from(friendInvitations)
    .where(eq(friendInvitations.id, invitationId))
    .limit(1);
  const inv = rows[0];
  if (!inv) {
    return { ok: false, code: 'not_found' };
  }
  if (inv.inviteeUserId !== inviteeUserId) {
    return { ok: false, code: 'forbidden' };
  }
  if (inv.status !== 'pending') {
    return { ok: false, code: 'bad_state' };
  }

  const { low, high } = canonicalFriendPair(inv.inviterUserId, inv.inviteeUserId);

  await db
    .update(friendInvitations)
    .set({
      status: 'accepted',
      respondedAt: new Date(),
    })
    .where(eq(friendInvitations.id, invitationId));

  if (!(await friendshipRowExists(low, high))) {
    await db.insert(friendships).values({
      userLowId: low,
      userHighId: high,
    });
  }

  return { ok: true };
}

export async function rejectMateInvitation(
  invitationId: number,
  inviteeUserId: number,
): Promise<InviteActionResult> {
  const rows = await db
    .select()
    .from(friendInvitations)
    .where(eq(friendInvitations.id, invitationId))
    .limit(1);
  const inv = rows[0];
  if (!inv) {
    return { ok: false, code: 'not_found' };
  }
  if (inv.inviteeUserId !== inviteeUserId) {
    return { ok: false, code: 'forbidden' };
  }
  if (inv.status !== 'pending') {
    return { ok: false, code: 'bad_state' };
  }

  await db
    .update(friendInvitations)
    .set({
      status: 'rejected',
      respondedAt: new Date(),
    })
    .where(eq(friendInvitations.id, invitationId));

  return { ok: true };
}

export async function cancelMateInvitation(
  invitationId: number,
  inviterUserId: number,
): Promise<InviteActionResult> {
  const rows = await db
    .select()
    .from(friendInvitations)
    .where(eq(friendInvitations.id, invitationId))
    .limit(1);
  const inv = rows[0];
  if (!inv) {
    return { ok: false, code: 'not_found' };
  }
  if (inv.inviterUserId !== inviterUserId) {
    return { ok: false, code: 'forbidden' };
  }
  if (inv.status !== 'pending') {
    return { ok: false, code: 'bad_state' };
  }

  await db
    .update(friendInvitations)
    .set({
      status: 'cancelled',
      respondedAt: new Date(),
    })
    .where(eq(friendInvitations.id, invitationId));

  return { ok: true };
}

export async function getRidePlanForUserAndDate(
  userId: number,
  rideOn: string,
) {
  const rows = await db
    .select({
      rideOn: ridePlans.rideOn,
      bikeParkId: ridePlans.bikeParkId,
      parkName: bikeParks.name,
    })
    .from(ridePlans)
    .innerJoin(bikeParks, eq(ridePlans.bikeParkId, bikeParks.id))
    .where(and(eq(ridePlans.userId, userId), eq(ridePlans.rideOn, rideOn)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertRidePlanForUser(input: {
  userId: number;
  rideOn: string;
  bikeParkId: string;
}) {
  const existing = await db
    .select({ userId: ridePlans.userId })
    .from(ridePlans)
    .where(
      and(
        eq(ridePlans.userId, input.userId),
        eq(ridePlans.rideOn, input.rideOn),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(ridePlans)
      .set({
        bikeParkId: input.bikeParkId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(ridePlans.userId, input.userId),
          eq(ridePlans.rideOn, input.rideOn),
        ),
      );
  } else {
    await db.insert(ridePlans).values({
      userId: input.userId,
      rideOn: input.rideOn,
      bikeParkId: input.bikeParkId,
    });
  }
}

export async function deleteRidePlanForUser(userId: number, rideOn: string) {
  await db
    .delete(ridePlans)
    .where(
      and(eq(ridePlans.userId, userId), eq(ridePlans.rideOn, rideOn)),
    );
}

const MATE_INVITE_LINK_VALID_DAYS = 90;

function newMateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

function inviterDisplayLabel(name: string | null, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    return first ?? trimmed;
  }
  const local = email.split('@')[0]?.trim();
  return local && local.length > 0 ? local : 'Someone';
}

export async function upsertMateInviteLink(inviterUserId: number): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MATE_INVITE_LINK_VALID_DAYS);
  const token = newMateInviteToken();
  const now = new Date();

  await db
    .insert(mateInviteLinks)
    .values({
      inviterUserId,
      token,
      expiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: mateInviteLinks.inviterUserId,
      set: {
        token,
        expiresAt,
        updatedAt: now,
      },
    });

  return { token, expiresAt };
}

export async function getMateInviteLinkForInviter(inviterUserId: number) {
  const rows = await db
    .select()
    .from(mateInviteLinks)
    .where(eq(mateInviteLinks.inviterUserId, inviterUserId))
    .limit(1);
  return rows[0] ?? null;
}

export type MateInvitePreviewResult =
  | { ok: true; inviterLabel: string }
  | { ok: false; code: 'invalid' | 'expired' };

export async function getMateInviteLinkPreview(
  token: string,
): Promise<MateInvitePreviewResult> {
  const rows = await db
    .select({
      expiresAt: mateInviteLinks.expiresAt,
      inviterName: users.name,
      inviterEmail: users.email,
    })
    .from(mateInviteLinks)
    .innerJoin(users, eq(mateInviteLinks.inviterUserId, users.id))
    .where(eq(mateInviteLinks.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { ok: false, code: 'invalid' };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, code: 'expired' };
  }
  return {
    ok: true,
    inviterLabel: inviterDisplayLabel(row.inviterName, row.inviterEmail),
  };
}

export type RedeemMateLinkResult =
  | { ok: true; alreadyMates: boolean }
  | { ok: false; code: 'invalid' | 'expired' | 'self' };

export async function redeemMateInviteLink(
  token: string,
  inviteeUserId: number,
): Promise<RedeemMateLinkResult> {
  const rows = await db
    .select({
      inviterId: mateInviteLinks.inviterUserId,
      expiresAt: mateInviteLinks.expiresAt,
    })
    .from(mateInviteLinks)
    .where(eq(mateInviteLinks.token, token))
    .limit(1);
  const link = rows[0];
  if (!link) {
    return { ok: false, code: 'invalid' };
  }
  if (link.expiresAt.getTime() <= Date.now()) {
    return { ok: false, code: 'expired' };
  }
  const inviterId = link.inviterId;
  if (inviterId === inviteeUserId) {
    return { ok: false, code: 'self' };
  }

  const { low, high } = canonicalFriendPair(inviterId, inviteeUserId);
  if (await friendshipRowExists(low, high)) {
    return { ok: true, alreadyMates: true };
  }

  await db.delete(friendInvitations).where(
    and(
      eq(friendInvitations.status, 'pending'),
      or(
        and(
          eq(friendInvitations.inviterUserId, inviterId),
          eq(friendInvitations.inviteeUserId, inviteeUserId),
        ),
        and(
          eq(friendInvitations.inviterUserId, inviteeUserId),
          eq(friendInvitations.inviteeUserId, inviterId),
        ),
      ),
    ),
  );

  if (await friendshipRowExists(low, high)) {
    return { ok: true, alreadyMates: true };
  }

  await db.insert(friendships).values({
    userLowId: low,
    userHighId: high,
  });

  return { ok: true, alreadyMates: false };
}

/** Mates with a ride plan at this park on or after `fromRideOn` (inclusive), one row per mate per day. */
export async function listMateRidePlansAtParkFromDate(
  viewerUserId: number,
  bikeParkId: string,
  fromRideOn: string,
): Promise<
  Array<{ id: number; name: string | null; email: string; rideOn: string }>
> {
  const mateIds = await getFriendUserIds(viewerUserId);
  if (mateIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      rideOn: ridePlans.rideOn,
    })
    .from(ridePlans)
    .innerJoin(users, eq(ridePlans.userId, users.id))
    .where(
      and(
        eq(ridePlans.bikeParkId, bikeParkId),
        inArray(ridePlans.userId, mateIds),
        gte(ridePlans.rideOn, fromRideOn),
      ),
    )
    .orderBy(asc(ridePlans.rideOn), asc(users.name), asc(users.email));

  return rows;
}

export type ParkRiderRow = {
  userId: number;
  name: string | null;
  email: string;
  rideOn: string;
  isViewer: boolean;
};

/** Mates plus the signed-in user’s own plans at this park (from date onward), sorted by date then name. */
export async function listParkRidersFromDate(
  viewerUserId: number,
  viewerProfile: { name: string | null; email: string },
  bikeParkId: string,
  fromRideOn: string,
): Promise<ParkRiderRow[]> {
  const [matePlans, selfPlanRows] = await Promise.all([
    listMateRidePlansAtParkFromDate(viewerUserId, bikeParkId, fromRideOn),
    db
      .select({ rideOn: ridePlans.rideOn })
      .from(ridePlans)
      .where(
        and(
          eq(ridePlans.userId, viewerUserId),
          eq(ridePlans.bikeParkId, bikeParkId),
          gte(ridePlans.rideOn, fromRideOn),
        ),
      )
      .orderBy(asc(ridePlans.rideOn)),
  ]);

  const out: ParkRiderRow[] = [];

  for (const r of selfPlanRows) {
    out.push({
      userId: viewerUserId,
      name: viewerProfile.name,
      email: viewerProfile.email,
      rideOn: r.rideOn,
      isViewer: true,
    });
  }

  for (const m of matePlans) {
    out.push({
      userId: m.id,
      name: m.name,
      email: m.email,
      rideOn: m.rideOn,
      isViewer: false,
    });
  }

  out.sort((a, b) => {
    const byDate = a.rideOn.localeCompare(b.rideOn);
    if (byDate !== 0) return byDate;
    if (a.isViewer !== b.isViewer) return a.isViewer ? -1 : 1;
    return (a.name?.trim() || a.email).localeCompare(b.name?.trim() || b.email);
  });

  return out;
}

export async function getMateRidePlansForDate(
  viewerUserId: number,
  rideOn: string,
): Promise<
  Array<{
    mateId: number;
    name: string | null;
    email: string;
    bikeParkId: string;
    parkName: string;
  }>
> {
  const mateIds = await getFriendUserIds(viewerUserId);
  if (mateIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      mateId: users.id,
      name: users.name,
      email: users.email,
      bikeParkId: ridePlans.bikeParkId,
      parkName: bikeParks.name,
    })
    .from(ridePlans)
    .innerJoin(users, eq(ridePlans.userId, users.id))
    .innerJoin(bikeParks, eq(ridePlans.bikeParkId, bikeParks.id))
    .where(
      and(eq(ridePlans.rideOn, rideOn), inArray(ridePlans.userId, mateIds)),
    )
    .orderBy(asc(bikeParks.name), asc(users.name), asc(users.email));

  return rows;
}

export async function getMateRideCountsByPark(
  viewerUserId: number,
  rideOn: string,
): Promise<Record<string, number>> {
  const mateIds = await getFriendUserIds(viewerUserId);
  if (mateIds.length === 0) {
    return {};
  }

  const rows = await db
    .select({
      bikeParkId: ridePlans.bikeParkId,
      c: sql<number>`count(distinct ${ridePlans.userId})::int`,
    })
    .from(ridePlans)
    .where(
      and(eq(ridePlans.rideOn, rideOn), inArray(ridePlans.userId, mateIds)),
    )
    .groupBy(ridePlans.bikeParkId);

  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.bikeParkId] = r.c;
  }
  return out;
}

/** For API routes that need 401 */
export async function requireSignedInUser(): Promise<
  { ok: true; user: User } | { ok: false; response: Response }
> {
  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
