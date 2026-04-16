import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  bikeParks,
  catalogItems,
  organizationMembers,
  users,
  type NewBikePark,
} from './schema';
import { withAuth } from '@workos-inc/authkit-nextjs';

export async function getUser() {
  try {
    const { user: wUser } = await withAuth();
    if (!wUser) {
      return null;
    }
    const row = await db
      .select()
      .from(users)
      .where(and(eq(users.workOsUserId, wUser.id), isNull(users.deletedAt)))
      .limit(1);
    return row[0] ?? null;
  } catch {
    return null;
  }
}

export async function getUserWithOrganization(userId: number) {
  const result = await db
    .select({
      user: users,
      organizationId: organizationMembers.organizationId,
    })
    .from(users)
    .leftJoin(organizationMembers, eq(users.id, organizationMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getOrganizationForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, user.id),
    with: {
      organization: {
        with: {
          organizationMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.organization || null;
}

export async function listCatalogItems() {
  return db.select().from(catalogItems);
}

export async function getCatalogItemBySlug(slug: string) {
  const rows = await db
    .select()
    .from(catalogItems)
    .where(eq(catalogItems.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function listBikeParkMarkers() {
  return db
    .select({
      id: bikeParks.id,
      name: bikeParks.name,
      latitude: bikeParks.latitude,
      longitude: bikeParks.longitude,
      ratingScore: bikeParks.ratingScore,
      logoUrl: bikeParks.logoUrl,
      pinLogoUrl: bikeParks.pinLogoUrl,
    })
    .from(bikeParks);
}

export async function getBikeParkById(id: string) {
  const rows = await db
    .select()
    .from(bikeParks)
    .where(eq(bikeParks.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertBikePark(row: NewBikePark) {
  const inserted = await db.insert(bikeParks).values(row).returning();
  return inserted[0] ?? null;
}

export async function updateBikeParkById(
  id: string,
  patch: Partial<
    Pick<
      NewBikePark,
      | 'name'
      | 'description'
      | 'latitude'
      | 'longitude'
      | 'logoUrl'
      | 'pinLogoUrl'
      | 'primaryCtaUrl'
      | 'buyTicketUrl'
      | 'amenities'
      | 'trailDifficultyCounts'
      | 'openingHours'
    >
  >,
) {
  const updated = await db
    .update(bikeParks)
    .set({
      ...patch,
      updatedAt: sql`now()`,
    })
    .where(eq(bikeParks.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function deleteBikeParkById(id: string) {
  const deleted = await db.delete(bikeParks).where(eq(bikeParks.id, id)).returning({ id: bikeParks.id });
  return deleted[0] ?? null;
}
