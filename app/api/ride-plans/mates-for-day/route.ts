import { ridePlanDateQuerySchema } from '@/lib/social/api-schemas';
import { getMateRidePlansForDate, requireSignedInUser } from '@/lib/social/queries';

export async function GET(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = ridePlanDateQuerySchema.safeParse({
    date: url.searchParams.get('date') ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const plans = await getMateRidePlansForDate(auth.user.id, parsed.data.date);
  return Response.json({ plans });
}
