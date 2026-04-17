import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  doublePrecision,
  uuid,
  jsonb,
  smallint,
  uniqueIndex,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { TrailDifficultyCounts } from '@/lib/bike-parks/trail-difficulties';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** When set, this account is linked to WorkOS AuthKit (social login). */
  workOsUserId: varchar('work_os_user_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

/** Multi-tenant workspace; physical table name remains `teams` for migration compatibility. */
export const organizations = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const organizationMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  organizationId: integer('team_id')
    .notNull()
    .references(() => organizations.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('team_id')
    .notNull()
    .references(() => organizations.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  organizationId: integer('team_id')
    .notNull()
    .references(() => organizations.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

/** Example catalog/listing table for public marketing and API demos. */
export const catalogItems = pgTable('catalog_items', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/** Mountain bike parks (seeded from local JSON; community can extend). */
export const bikeParks = pgTable('bike_parks', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 512 }).notNull(),
  description: text('description'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  logoUrl: text('logo_url'),
  pinLogoUrl: text('pin_logo_url'),
  amenities: jsonb('amenities').$type<Record<string, boolean>>(),
  trailDifficultyCounts:
    jsonb('trail_difficulty_counts').$type<TrailDifficultyCounts>(),
  ratingScore: doublePrecision('rating_score'),
  ratingVoteCount: integer('rating_vote_count'),
  primaryCtaUrl: text('primary_cta_url'),
  buyTicketUrl: text('buy_ticket_url'),
  primaryCtaType: varchar('primary_cta_type', { length: 64 }),
  payment: varchar('payment', { length: 64 }),
  status: varchar('status', { length: 64 }),
  galleryImageUrls: jsonb('gallery_image_urls').$type<string[]>(),
  /** Structured hours when available (manual or future import). */
  openingHours: jsonb('opening_hours'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const parkReviews = pgTable(
  'park_reviews',
  {
    id: serial('id').primaryKey(),
    bikeParkId: uuid('bike_park_id')
      .notNull()
      .references(() => bikeParks.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    rating: smallint('rating').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    bikeParkUserUnique: uniqueIndex('park_reviews_bike_park_user_unique').on(
      table.bikeParkId,
      table.userId,
    ),
  }),
);

/** Mate requests (distinct from org `invitations`). */
export const friendInvitations = pgTable('friend_invitations', {
  id: serial('id').primaryKey(),
  inviterUserId: integer('inviter_user_id')
    .notNull()
    .references(() => users.id),
  inviteeUserId: integer('invitee_user_id')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  respondedAt: timestamp('responded_at'),
});

/** Accepted mates only; canonical ordering user_low_id < user_high_id. */
export const friendships = pgTable(
  'friendships',
  {
    userLowId: integer('user_low_id')
      .notNull()
      .references(() => users.id),
    userHighId: integer('user_high_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userLowId, t.userHighId] }),
  }),
);

/** One planned park per user per calendar day (local date from client). */
export const ridePlans = pgTable(
  'ride_plans',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rideOn: date('ride_on', { mode: 'string' }).notNull(),
    bikeParkId: uuid('bike_park_id')
      .notNull()
      .references(() => bikeParks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.rideOn] }),
  }),
);

/** Shareable mate invite link (one active row per inviter; token rotated on refresh). */
export const mateInviteLinks = pgTable('mate_invite_links', {
  inviterUserId: integer('inviter_user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  invitationsSent: many(invitations),
  parkReviews: many(parkReviews),
}));

export const bikeParksRelations = relations(bikeParks, ({ many }) => ({
  reviews: many(parkReviews),
}));

export const parkReviewsRelations = relations(parkReviews, ({ one }) => ({
  bikePark: one(bikeParks, {
    fields: [parkReviews.bikeParkId],
    references: [bikeParks.id],
  }),
  user: one(users, {
    fields: [parkReviews.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
  })
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type NewCatalogItem = typeof catalogItems.$inferInsert;
export type BikePark = typeof bikeParks.$inferSelect;
export type NewBikePark = typeof bikeParks.$inferInsert;
export type ParkReview = typeof parkReviews.$inferSelect;
export type NewParkReview = typeof parkReviews.$inferInsert;
export type FriendInvitation = typeof friendInvitations.$inferSelect;
export type NewFriendInvitation = typeof friendInvitations.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type RidePlan = typeof ridePlans.$inferSelect;
export type NewRidePlan = typeof ridePlans.$inferInsert;
export type MateInviteLink = typeof mateInviteLinks.$inferSelect;
export type NewMateInviteLink = typeof mateInviteLinks.$inferInsert;

export type OrganizationWithMembers = Organization & {
  organizationMembers: (OrganizationMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  REMOVE_ORGANIZATION_MEMBER = 'REMOVE_ORGANIZATION_MEMBER',
  INVITE_ORGANIZATION_MEMBER = 'INVITE_ORGANIZATION_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
