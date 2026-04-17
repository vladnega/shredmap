import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const friendInviteEmailBodySchema = z.object({
  email: z.string().trim().email().max(255),
});

export const ridePlanPutBodySchema = z.object({
  date: isoDate,
  bikeParkId: z.string().uuid(),
});

export const ridePlanDateQuerySchema = z.object({
  date: isoDate,
});

/** `from` = first calendar day to include (client sends local “today” as YYYY-MM-DD). */
export const matesAtParkQuerySchema = z.object({
  bikeParkId: z.string().uuid(),
  from: isoDate,
});
