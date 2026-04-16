import { desc, and, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  bikeParks,
  catalogItems,
  organizationMembers,
  parkReviews,
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
      | 'payment'
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

function formatReviewerDisplayName(
  name: string | null,
  email: string,
): string {
  const trimmedName = (name ?? '').trim();
  if (trimmedName.length > 0) {
    const nameParts = trimmedName.split(/\s+/);
    const firstName = nameParts[0];
    const lastToken = nameParts.at(-1);
    if (lastToken && lastToken !== firstName) {
      const lastInitial = lastToken.charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    }
    return firstName;
  }

  const emailPrefix = email.split('@')[0]?.trim();
  if (emailPrefix && emailPrefix.length > 0) {
    return `${emailPrefix.charAt(0).toUpperCase()}.`;
  }
  return 'Rider';
}

type ListParkReviewsOptions = {
  bikeParkId: string;
  cursor?: number;
  limit: number;
  rating?: number;
};

export type ParkReviewListItem = {
  id: number;
  rating: number;
  description: string;
  createdAt: Date;
  reviewerDisplayName: string;
};

export type ParkReviewsSummary = {
  totalCount: number;
  averageRating: number;
  ratingBuckets: Record<'1' | '2' | '3' | '4' | '5', number>;
};

export async function upsertBikeParkReviewForUser(input: {
  bikeParkId: string;
  userId: number;
  rating: number;
  description: string;
}) {
  const existingRows = await db
    .select({ id: parkReviews.id })
    .from(parkReviews)
    .where(
      and(
        eq(parkReviews.bikeParkId, input.bikeParkId),
        eq(parkReviews.userId, input.userId),
      ),
    )
    .orderBy(desc(parkReviews.id))
    .limit(1);

  const existing = existingRows[0];

  if (existing) {
    const updatedRows = await db
      .update(parkReviews)
      .set({
        rating: input.rating,
        body: input.description,
      })
      .where(eq(parkReviews.id, existing.id))
      .returning({
        id: parkReviews.id,
        bikeParkId: parkReviews.bikeParkId,
        userId: parkReviews.userId,
        rating: parkReviews.rating,
        description: parkReviews.body,
        createdAt: parkReviews.createdAt,
      });
    return updatedRows[0] ?? null;
  }

  const insertedRows = await db
    .insert(parkReviews)
    .values({
      bikeParkId: input.bikeParkId,
      userId: input.userId,
      rating: input.rating,
      body: input.description,
    })
    .returning({
      id: parkReviews.id,
      bikeParkId: parkReviews.bikeParkId,
      userId: parkReviews.userId,
      rating: parkReviews.rating,
      description: parkReviews.body,
      createdAt: parkReviews.createdAt,
    });

  return insertedRows[0] ?? null;
}

export async function getBikeParkReviewByUserForPark(input: {
  bikeParkId: string;
  userId: number;
}) {
  const rows = await db
    .select({
      id: parkReviews.id,
      rating: parkReviews.rating,
      description: parkReviews.body,
      createdAt: parkReviews.createdAt,
    })
    .from(parkReviews)
    .where(
      and(
        eq(parkReviews.bikeParkId, input.bikeParkId),
        eq(parkReviews.userId, input.userId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listBikeParkReviews({
  bikeParkId,
  cursor,
  limit,
  rating,
}: ListParkReviewsOptions): Promise<{
  items: ParkReviewListItem[];
  nextCursor: number | null;
}> {
  const clauses = [eq(parkReviews.bikeParkId, bikeParkId)];
  if (cursor !== undefined) {
    clauses.push(lt(parkReviews.id, cursor));
  }
  if (rating !== undefined) {
    clauses.push(eq(parkReviews.rating, rating));
  }

  const rows = await db
    .select({
      id: parkReviews.id,
      rating: parkReviews.rating,
      description: parkReviews.body,
      createdAt: parkReviews.createdAt,
      reviewerName: users.name,
      reviewerEmail: users.email,
    })
    .from(parkReviews)
    .innerJoin(users, eq(parkReviews.userId, users.id))
    .where(and(...clauses))
    .orderBy(desc(parkReviews.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const visibleRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? visibleRows[visibleRows.length - 1]?.id ?? null : null;

  return {
    items: visibleRows.map((row) => ({
      id: row.id,
      rating: row.rating,
      description: row.description,
      createdAt: row.createdAt,
      reviewerDisplayName: formatReviewerDisplayName(row.reviewerName, row.reviewerEmail),
    })),
    nextCursor,
  };
}

export async function getBikeParkReviewSummary(
  bikeParkId: string,
): Promise<ParkReviewsSummary> {
  const rows = await db
    .select({
      totalCount: sql<number>`count(*)::int`,
      averageRating: sql<number>`coalesce(avg(${parkReviews.rating})::float8, 0)`,
      rating1: sql<number>`coalesce(sum(case when ${parkReviews.rating} = 1 then 1 else 0 end), 0)::int`,
      rating2: sql<number>`coalesce(sum(case when ${parkReviews.rating} = 2 then 1 else 0 end), 0)::int`,
      rating3: sql<number>`coalesce(sum(case when ${parkReviews.rating} = 3 then 1 else 0 end), 0)::int`,
      rating4: sql<number>`coalesce(sum(case when ${parkReviews.rating} = 4 then 1 else 0 end), 0)::int`,
      rating5: sql<number>`coalesce(sum(case when ${parkReviews.rating} = 5 then 1 else 0 end), 0)::int`,
    })
    .from(parkReviews)
    .where(eq(parkReviews.bikeParkId, bikeParkId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return {
      totalCount: 0,
      averageRating: 0,
      ratingBuckets: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    };
  }

  return {
    totalCount: row.totalCount,
    averageRating: row.averageRating,
    ratingBuckets: {
      '1': row.rating1,
      '2': row.rating2,
      '3': row.rating3,
      '4': row.rating4,
      '5': row.rating5,
    },
  };
}
