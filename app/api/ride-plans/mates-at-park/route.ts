import { matesAtParkQuerySchema } from '@/lib/social/api-schemas';
import { listParkRidersFromDate, requireSignedInUser } from '@/lib/social/queries';

export async function GET(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = matesAtParkQuerySchema.safeParse({
    bikeParkId: url.searchParams.get('bikeParkId') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const riders = await listParkRidersFromDate(
    auth.user.id,
    { name: auth.user.name, email: auth.user.email },
    parsed.data.bikeParkId,
    parsed.data.from,
  );
  return Response.json({ riders });
}
