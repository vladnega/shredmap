import { bikeParkCreateBodySchema, bikeParkPatchBodySchema, parkRequestPatchBodySchema } from '@/lib/bike-parks/api-schemas';
import { requireBikeParkStaff } from '@/lib/auth/bike-park-staff';
import {
  getBikeParkById,
  getBikeParkRequestById,
  updateBikeParkRequestPatchById,
} from '@/lib/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  const { id } = await params;
  const parkRequest = await getBikeParkRequestById(id);
  if (!parkRequest) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const targetPark = parkRequest.targetParkId
    ? await getBikeParkById(parkRequest.targetParkId)
    : null;

  return Response.json({
    parkRequest,
    targetPark,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  const { id } = await params;
  const existing = await getBikeParkRequestById(id);
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (existing.status !== 'pending') {
    return Response.json({ error: 'Only pending Park Requests can be edited' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parkRequestPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (existing.requestType === 'amendment') {
    const amendment = bikeParkPatchBodySchema.safeParse(parsed.data.proposedPatch);
    if (!amendment.success) {
      return Response.json(
        { error: 'Patch payload is not valid for amendment requests' },
        { status: 400 },
      );
    }
  } else {
    const newPark = bikeParkCreateBodySchema.safeParse(parsed.data.proposedPatch);
    if (!newPark.success) {
      return Response.json(
        { error: 'Patch payload is not valid for new park requests' },
        { status: 400 },
      );
    }
  }

  const updated = await updateBikeParkRequestPatchById(id, parsed.data.proposedPatch);
  if (!updated) {
    return Response.json({ error: 'Could not update Park Request' }, { status: 409 });
  }
  return Response.json(updated);
}
