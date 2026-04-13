import { z } from 'zod';

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
  logoUrl: optionalUrl.optional(),
  pinLogoUrl: optionalUrl.optional(),
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
    logoUrl: patchOptionalUrl,
    pinLogoUrl: patchOptionalUrl,
  })
  .refine(
    (obj) =>
      obj.name !== undefined ||
      obj.description !== undefined ||
      obj.latitude !== undefined ||
      obj.longitude !== undefined ||
      obj.website !== undefined ||
      obj.logoUrl !== undefined ||
      obj.pinLogoUrl !== undefined,
    { message: 'At least one field is required' },
  );

export type BikeParkPatchBody = z.infer<typeof bikeParkPatchBodySchema>;
