import { ridePlanDateQuerySchema, ridePlanPutBodySchema } from '@/lib/social/api-schemas';
import {
  deleteRidePlanForUser,
  getRidePlanForUserAndDate,
  requireSignedInUser,
  upsertRidePlanForUser,
} from '@/lib/social/queries';
import { getBikeParkById } from '@/lib/db/queries';

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

  const plan = await getRidePlanForUserAndDate(auth.user.id, parsed.data.date);
  return Response.json({ plan });
}

export async function PUT(request: Request) {
  const auth = await requireSignedInUser();
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ridePlanPutBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const park = await getBikeParkById(parsed.data.bikeParkId);
  if (!park) {
    return Response.json({ error: 'Bike park not found' }, { status: 404 });
  }

  await upsertRidePlanForUser({
    userId: auth.user.id,
    rideOn: parsed.data.date,
    bikeParkId: parsed.data.bikeParkId,
  });

  const plan = await getRidePlanForUserAndDate(auth.user.id, parsed.data.date);
  return Response.json({ plan });
}

export async function DELETE(request: Request) {
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

  await deleteRidePlanForUser(auth.user.id, parsed.data.date);
  return Response.json({ ok: true });
}
