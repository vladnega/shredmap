import {
  bikeParkReviewBodySchema,
  bikeParkReviewListQuerySchema,
} from '@/lib/bike-parks/api-schemas';
import { requireBikeParkReviewAuthor } from '@/lib/auth/bike-park-review-auth';
import {
  getBikeParkById,
  getBikeParkReviewByUserForPark,
  getBikeParkReviewSummary,
  getUser,
  listBikeParkReviews,
  upsertBikeParkReviewForUser,
} from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);

  const parsedQuery = bikeParkReviewListQuerySchema.safeParse({
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    rating: url.searchParams.get('rating') ?? undefined,
  });
  if (!parsedQuery.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsedQuery.error.flatten() },
      { status: 400 },
    );
  }

  const parkPromise = getBikeParkById(id);
  const reviewSummaryPromise = getBikeParkReviewSummary(id);
  const reviewsPromise = listBikeParkReviews({
    bikeParkId: id,
    cursor: parsedQuery.data.cursor,
    limit: parsedQuery.data.limit,
    rating: parsedQuery.data.rating,
  });
  const userPromise = getUser();

  const [park, summary, page, user] = await Promise.all([
    parkPromise,
    reviewSummaryPromise,
    reviewsPromise,
    userPromise,
  ]);
  if (!park) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const viewerReview = user
    ? await getBikeParkReviewByUserForPark({ bikeParkId: id, userId: user.id })
    : null;

  return Response.json({
    summary,
    items: page.items,
    nextCursor: page.nextCursor,
    viewerReview,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const reviewAuth = await requireBikeParkReviewAuthor();
  if (!reviewAuth.ok) {
    return reviewAuth.response;
  }

  const { id } = await params;
  const park = await getBikeParkById(id);
  if (!park) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsedBody = bikeParkReviewBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const review = await upsertBikeParkReviewForUser({
    bikeParkId: id,
    userId: reviewAuth.appUserId,
    rating: parsedBody.data.rating,
    description: parsedBody.data.description,
  });
  if (!review) {
    return Response.json(
      { error: 'Could not save review right now.' },
      { status: 500 },
    );
  }

  return Response.json({ review });
}
