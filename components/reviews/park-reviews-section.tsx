'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { BIKE_PARK_REVIEW_ROLE_SLUGS } from '@/lib/auth/bike-park-review-roles';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { ReviewFilter } from '@/components/reviews/review-filter';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { ReviewsSummary } from '@/components/reviews/reviews-summary';
import { fetchParkReviewsPage } from '@/components/reviews/fetch-park-reviews-page';
import type {
  ParkReviewSummary,
  ParkReviewsPageResponse,
} from '@/components/reviews/review-types';
import { Button } from '@/components/ui/button';

type WorkOsRolesPayload = { roles: string[] };

const DEFAULT_SUMMARY: ParkReviewSummary = {
  totalCount: 0,
  averageRating: 0,
  ratingBuckets: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
};
const REVIEWS_PAGE_SIZE = 8;

function roleFetcher(url: string): Promise<WorkOsRolesPayload> {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json() as Promise<WorkOsRolesPayload>;
  });
}

function getCanWriteReview(roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  const roleSet = new Set(roles);
  return BIKE_PARK_REVIEW_ROLE_SLUGS.some((role) => roleSet.has(role));
}

export function ParkReviewsSection({
  bikeParkId,
}: {
  bikeParkId: string;
}) {
  const { data: user } = useAppUser();
  const { data: roleData } = useSWR<WorkOsRolesPayload>(
    user ? '/api/workos/roles' : null,
    roleFetcher,
    { revalidateOnFocus: false },
  );
  const canWriteReview = getCanWriteReview(roleData?.roles);

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ParkReviewsPageResponse | null) => {
      if (previousPageData && previousPageData.nextCursor === null) {
        return null;
      }

      const search = new URLSearchParams();
      search.set('limit', String(REVIEWS_PAGE_SIZE));
      if (ratingFilter !== null) {
        search.set('rating', String(ratingFilter));
      }
      if (pageIndex > 0 && previousPageData?.nextCursor != null) {
        search.set('cursor', String(previousPageData.nextCursor));
      }
      return `/api/bike-parks/${bikeParkId}/reviews?${search.toString()}`;
    },
    [bikeParkId, ratingFilter],
  );

  const {
    data,
    error,
    isLoading,
    isValidating,
    setSize,
    size,
  } = useSWRInfinite<ParkReviewsPageResponse>(getKey, fetchParkReviewsPage, {
    revalidateFirstPage: false,
  });

  useEffect(() => {
    void setSize(1);
  }, [ratingFilter, setSize]);

  const summary = data?.[0]?.summary ?? DEFAULT_SUMMARY;
  const viewerReview = data?.[0]?.viewerReview ?? null;
  const reviews = useMemo(
    () => (data ? data.flatMap((page) => page.items) : []),
    [data],
  );
  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;
  const hasMore = nextCursor !== null;
  const isLoadingMore = isValidating && size > 0;

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    void setSize((current) => current + 1);
  }, [hasMore, isLoadingMore, setSize]);

  const reviewEditorHref = `/bike-parks/${bikeParkId}/review`;

  return (
    <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <ReviewsSummary summary={summary} />
      <ReviewFilter selectedRating={ratingFilter} onChange={setRatingFilter} />

      <div className="mt-4">
        {user && canWriteReview && (
          <Button
            asChild
            size="sm"
            className="rounded-full bg-orange-600 text-white hover:bg-orange-500"
          >
            <Link href={reviewEditorHref}>{viewerReview ? 'Edit your review' : 'Write a review'}</Link>
          </Button>
        )}
        {!user && (
          <p className="text-xs text-zinc-500">
            <Link href="/sign-in" className="text-orange-400 hover:underline">
              Sign in
            </Link>{' '}
            to post a review.
          </p>
        )}
        {user && !canWriteReview && (
          <p className="text-xs text-zinc-500">
            Your account role cannot post reviews yet. Ask an admin to assign the member, moderator,
            or admin role in WorkOS.
          </p>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/20 p-3 text-sm text-red-200">
          Could not load reviews right now.
        </p>
      ) : isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading reviews...</p>
      ) : (
        <ReviewsList
          reviews={reviews}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </section>
  );
}
