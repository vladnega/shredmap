import { requireBikeParkReviewAuthor } from '@/lib/auth/bike-park-review-auth';
import { listBikeParkRequests } from '@/lib/db/queries';

export async function GET() {
  const author = await requireBikeParkReviewAuthor();
  if (!author.ok) {
    return author.response;
  }

  const requests = await listBikeParkRequests({ requesterUserId: author.appUserId });
  return Response.json({ requests });
}
