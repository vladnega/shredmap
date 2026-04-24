import { randomUUID } from 'node:crypto';
import { bikeParkCreateBodySchema, bikeParkPatchBodySchema } from '@/lib/bike-parks/api-schemas';
import { selectedFacilitiesToAmenities } from '@/lib/bike-parks/facilities';
import { escapeHtmlForParkDescription } from '@/lib/bike-parks/api-schemas';
import { requireBikeParkStaffReviewer } from '@/lib/auth/bike-park-staff-review-auth';
import {
  getBikeParkRequestById,
  insertBikePark,
  markBikeParkRequestApproved,
  updateBikeParkById,
} from '@/lib/db/queries';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reviewer = await requireBikeParkStaffReviewer();
  if (!reviewer.ok) {
    return reviewer.response;
  }

  const { id } = await params;
  const parkRequest = await getBikeParkRequestById(id);
  if (!parkRequest) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (parkRequest.status !== 'pending') {
    return Response.json({ error: 'Park Request is already resolved' }, { status: 409 });
  }

  if (parkRequest.requestType === 'amendment') {
    if (!parkRequest.targetParkId) {
      return Response.json({ error: 'Missing target park id' }, { status: 400 });
    }
    const parsedPatch = bikeParkPatchBodySchema.safeParse(parkRequest.proposedPatch);
    if (!parsedPatch.success) {
      return Response.json({ error: 'Invalid amendment payload' }, { status: 400 });
    }
    const data = parsedPatch.data;
    const updated = await updateBikeParkById(parkRequest.targetParkId, {
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

    if (!updated) {
      return Response.json({ error: 'Could not apply amendment to park' }, { status: 404 });
    }
  } else {
    const parsedCreate = bikeParkCreateBodySchema.safeParse(parkRequest.proposedPatch);
    if (!parsedCreate.success) {
      return Response.json({ error: 'Invalid new park payload' }, { status: 400 });
    }

    const data = parsedCreate.data;
    const inserted = await insertBikePark({
      id: randomUUID(),
      name: data.name,
      description: escapeHtmlForParkDescription(data.description),
      latitude: data.latitude,
      longitude: data.longitude,
      primaryCtaUrl: data.website ?? null,
      buyTicketUrl: data.buyTicketUrl ?? null,
      payment: data.payment,
      logoUrl: data.logoUrl ?? null,
      pinLogoUrl: data.pinLogoUrl ?? null,
      amenities: selectedFacilitiesToAmenities(data.facilities),
      trailDifficultyCounts: data.trailDifficultyCounts,
      openingHours: data.openingHours ?? null,
    });
    if (!inserted) {
      return Response.json({ error: 'Could not create park from Park Request' }, { status: 500 });
    }
  }

  const approved = await markBikeParkRequestApproved({
    id: parkRequest.id,
    reviewerUserId: reviewer.appUserId,
  });
  if (!approved) {
    return Response.json(
      { error: 'Park Request could not be marked as approved' },
      { status: 409 },
    );
  }

  return Response.json(approved);
}
