'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { BIKE_PARK_REVIEW_ROLE_SLUGS } from '@/lib/auth/bike-park-review-roles';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { ReviewFilter } from '@/components/reviews/review-filter';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { ReviewsSummary } from '@/components/reviews/reviews-summary';
import type {
  ParkReviewSummary,
  ParkReviewsPageResponse,
} from '@/components/reviews/review-types';

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

function reviewsPageFetcher(url: string): Promise<ParkReviewsPageResponse> {
  return fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load reviews (${response.status})`);
    }
    return response.json() as Promise<ParkReviewsPageResponse>;
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    mutate,
  } = useSWRInfinite<ParkReviewsPageResponse>(getKey, reviewsPageFetcher, {
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

  const handleSubmit = useCallback(
    async (values: { rating: number; description: string }) => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const response = await fetch(`/api/bike-parks/${bikeParkId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const errorMessage =
            typeof payload === 'object' &&
            payload &&
            'error' in payload &&
            typeof payload.error === 'string'
              ? payload.error
              : `Could not save review (${response.status})`;
          setSubmitError(errorMessage);
          return;
        }
        await mutate();
      } catch {
        setSubmitError('Could not save review right now.');
      } finally {
        setSubmitting(false);
      }
    },
    [bikeParkId, mutate],
  );

  return (
    <section className="mt-8">
      <ReviewsSummary summary={summary} />
      <ReviewFilter
        selectedRating={ratingFilter}
        summary={summary}
        onChange={setRatingFilter}
      />

      <ReviewForm
        signedIn={Boolean(user)}
        canReview={canWriteReview}
        viewerReview={viewerReview}
        isSubmitting={submitting}
        onSubmit={handleSubmit}
      />
      {submitError && <p className="mt-2 text-xs text-red-400">{submitError}</p>}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-sm text-red-200">
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
