import {
  bikeParkPatchBodySchema,
  escapeHtmlForParkDescription,
} from '@/lib/bike-parks/api-schemas';
import { selectedFacilitiesToAmenities } from '@/lib/bike-parks/facilities';
import { requireBikeParkStaff } from '@/lib/auth/bike-park-staff';
import {
  deleteBikeParkById,
  getBikeParkById,
  updateBikeParkById,
} from '@/lib/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const park = await getBikeParkById(id);
  if (!park) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json(park);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bikeParkPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getBikeParkById(id);
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const data = parsed.data;
  const row = await updateBikeParkById(id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined
      ? { description: escapeHtmlForParkDescription(data.description) }
      : {}),
    ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
    ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
    ...(data.website !== undefined ? { primaryCtaUrl: data.website ?? null } : {}),
    ...(data.buyTicketUrl !== undefined
      ? { buyTicketUrl: data.buyTicketUrl ?? null }
      : {}),
    ...(data.payment !== undefined ? { payment: data.payment ?? null } : {}),
    ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl ?? null } : {}),
    ...(data.pinLogoUrl !== undefined ? { pinLogoUrl: data.pinLogoUrl ?? null } : {}),
    ...(data.facilities !== undefined
      ? { amenities: selectedFacilitiesToAmenities(data.facilities) }
      : {}),
    ...(data.trailDifficultyCounts !== undefined
      ? { trailDifficultyCounts: data.trailDifficultyCounts }
      : {}),
    ...(data.openingHours !== undefined
      ? { openingHours: data.openingHours }
      : {}),
  });

  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  const { id } = await params;
  const removed = await deleteBikeParkById(id);
  if (!removed) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
