import { requireBikeParkStaffReviewer } from '@/lib/auth/bike-park-staff-review-auth';
import {
  getBikeParkRequestById,
  markBikeParkRequestRejected,
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

  const rejected = await markBikeParkRequestRejected({
    id: parkRequest.id,
    reviewerUserId: reviewer.appUserId,
  });
  if (!rejected) {
    return Response.json(
      { error: 'Park Request could not be marked as rejected' },
      { status: 409 },
    );
  }

  return Response.json(rejected);
}
