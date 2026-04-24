import { randomUUID } from 'node:crypto';
import { requireBikeParkReviewAuthor } from '@/lib/auth/bike-park-review-auth';
import { parkRequestCreateBodySchema } from '@/lib/bike-parks/api-schemas';
import {
  createBikeParkRequest,
  getBikeParkById,
} from '@/lib/db/queries';

export async function POST(request: Request) {
  const author = await requireBikeParkReviewAuthor();
  if (!author.ok) {
    return author.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parkRequestCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.requestType === 'amendment') {
    const target = await getBikeParkById(parsed.data.targetParkId);
    if (!target) {
      return Response.json({ error: 'Target bike park not found' }, { status: 404 });
    }
  }

  const row = await createBikeParkRequest({
    id: randomUUID(),
    requestType: parsed.data.requestType,
    requesterUserId: author.appUserId,
    targetParkId:
      parsed.data.requestType === 'amendment'
        ? parsed.data.targetParkId
        : null,
    proposedPatch: parsed.data.proposedPatch,
  });

  if (!row) {
    return Response.json({ error: 'Could not create Park Request' }, { status: 500 });
  }

  return Response.json(row, { status: 201 });
}
