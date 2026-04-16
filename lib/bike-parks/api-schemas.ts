import { z } from 'zod';
import { BIKE_PARK_FACILITY_SLUGS } from '@/lib/bike-parks/facilities';
import {
  EMPTY_TRAIL_DIFFICULTY_COUNTS,
} from '@/lib/bike-parks/trail-difficulties';

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const optionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((s) => {
    if (s === undefined || s === null) return undefined;
    const t = s.trim();
    return t.length === 0 ? undefined : t;
  })
  .refine((s) => s === undefined || isHttpUrl(s), 'Must be a valid http(s) URL');

/** PATCH: omit field = unchanged; null = clear column; string = set (http/https). */
const patchOptionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((s): string | null | undefined => {
    if (s === undefined) return undefined;
    if (s === null) return null;
    const t = s.trim();
    if (t.length === 0) return undefined;
    return t;
  })
  .refine(
    (s) => s === undefined || s === null || isHttpUrl(s),
    'Must be a valid http(s) URL',
  );

const facilitiesSchema = z
  .array(z.enum(BIKE_PARK_FACILITY_SLUGS))
  .max(BIKE_PARK_FACILITY_SLUGS.length)
  .transform((values) => Array.from(new Set(values)));

const trailDifficultyCountsSchema = z.object({
  green: z.number().int().nonnegative(),
  blue: z.number().int().nonnegative(),
  red: z.number().int().nonnegative(),
  black: z.number().int().nonnegative(),
  doubleBlack: z.number().int().nonnegative(),
});
const openingHoursSchema = z.record(
  z.string().trim().min(1).max(32),
  z.string().trim().min(1).max(120),
);
const patchOpeningHoursSchema = z
  .union([openingHoursSchema, z.null(), z.undefined()])
  .optional();

/** Escape minimal HTML for user-provided description shown with dangerouslySetInnerHTML. */
export function escapeHtmlForParkDescription(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
  return `<p>${escaped}</p>`;
}

export const bikeParkCreateBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(512),
  description: z.string().trim().min(1, 'description is required').max(50_000),
  latitude: z.number().finite().refine((n) => n >= -90 && n <= 90, 'latitude out of range'),
  longitude: z
    .number()
    .finite()
    .refine((n) => n >= -180 && n <= 180, 'longitude out of range'),
  website: optionalUrl.optional(),
  buyTicketUrl: optionalUrl.optional(),
  logoUrl: optionalUrl.optional(),
  pinLogoUrl: optionalUrl.optional(),
  facilities: facilitiesSchema.default([]),
  trailDifficultyCounts: trailDifficultyCountsSchema.default(
    EMPTY_TRAIL_DIFFICULTY_COUNTS,
  ),
  openingHours: openingHoursSchema.optional(),
});

export type BikeParkCreateBody = z.infer<typeof bikeParkCreateBodySchema>;

export const bikeParkPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(512).optional(),
    description: z.string().trim().min(1).max(50_000).optional(),
    latitude: z
      .number()
      .finite()
      .refine((n) => n >= -90 && n <= 90, 'latitude out of range')
      .optional(),
    longitude: z
      .number()
      .finite()
      .refine((n) => n >= -180 && n <= 180, 'longitude out of range')
      .optional(),
    website: patchOptionalUrl,
    buyTicketUrl: patchOptionalUrl,
    payment: z
      .union([z.literal('paid'), z.literal('free'), z.null(), z.undefined()])
      .optional(),
    logoUrl: patchOptionalUrl,
    pinLogoUrl: patchOptionalUrl,
    facilities: facilitiesSchema.optional(),
    trailDifficultyCounts: trailDifficultyCountsSchema.optional(),
    openingHours: patchOpeningHoursSchema,
  })
  .refine(
    (obj) =>
      obj.name !== undefined ||
      obj.description !== undefined ||
      obj.latitude !== undefined ||
      obj.longitude !== undefined ||
      obj.website !== undefined ||
      obj.buyTicketUrl !== undefined ||
      obj.payment !== undefined ||
      obj.logoUrl !== undefined ||
      obj.pinLogoUrl !== undefined ||
      obj.facilities !== undefined ||
      obj.trailDifficultyCounts !== undefined ||
      obj.openingHours !== undefined,
    { message: 'At least one field is required' },
  );

export type BikeParkPatchBody = z.infer<typeof bikeParkPatchBodySchema>;

const reviewDescriptionValidationMessage =
  'Tell riders what trails or facilities stood out on your visit.';

export const bikeParkReviewBodySchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number between 1 and 5')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  description: z
    .string()
    .trim()
    .min(1, reviewDescriptionValidationMessage)
    .max(2_500, 'Keep your review under 2500 characters.'),
});

const cursorFromQueryParam = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().positive('Cursor must be a positive integer').optional());

const limitFromQueryParam = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().min(1, 'Limit must be at least 1').max(25, 'Limit must be 25 or lower').default(10));

const ratingFromQueryParam = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().min(1, 'Rating filter must be between 1 and 5').max(5, 'Rating filter must be between 1 and 5').optional());

export const bikeParkReviewListQuerySchema = z.object({
  cursor: cursorFromQueryParam,
  limit: limitFromQueryParam,
  rating: ratingFromQueryParam,
});

export type BikeParkReviewBody = z.infer<typeof bikeParkReviewBodySchema>;
export type BikeParkReviewListQuery = z.infer<typeof bikeParkReviewListQuerySchema>;
