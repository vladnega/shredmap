'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { mutate as mutateSWR } from 'swr';
import { BIKE_PARK_REVIEW_ROLE_SLUGS } from '@/lib/auth/bike-park-review-roles';
import { Button } from '@/components/ui/button';
import {
  fetchParkReviewsPage,
  parkReviewsSummaryListKey,
} from '@/components/reviews/fetch-park-reviews-page';
import { StarRatingInput } from '@/components/reviews/star-rating-input';
type WorkOsRolesPayload = { roles: string[] };

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

export function BikeParkReviewEditor({
  parkId,
  parkName,
}: {
  parkId: string;
  parkName: string;
}) {
  const router = useRouter();
  const { data: roleData, isLoading: rolesLoading } = useSWR<WorkOsRolesPayload>(
    '/api/workos/roles',
    roleFetcher,
    { revalidateOnFocus: false },
  );
  const canWriteReview = getCanWriteReview(roleData?.roles);

  const reviewsKey = parkReviewsSummaryListKey(parkId);
  const { data, error, isLoading } = useSWR(reviewsKey, fetchParkReviewsPage, {
    revalidateOnFocus: false,
  });

  const viewerReview = data?.viewerReview ?? null;

  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerReview) {
      setRating(5);
      setDescription('');
      return;
    }
    setRating(viewerReview.rating);
    setDescription(viewerReview.description);
  }, [viewerReview]);

  const homeParkHref = `/?park=${encodeURIComponent(parkId)}`;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSubmitError(null);
      setSubmitting(true);
      try {
        const response = await fetch(`/api/bike-parks/${parkId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, description: description.trim() }),
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
        await mutateSWR(
          (key) => typeof key === 'string' && key.includes(`/api/bike-parks/${parkId}/reviews`),
          undefined,
          { revalidate: true },
        );
        await mutateSWR(parkReviewsSummaryListKey(parkId));
        router.push(homeParkHref);
      } catch {
        setSubmitError('Could not save review right now.');
      } finally {
        setSubmitting(false);
      }
    },
    [description, homeParkHref, parkId, rating, router],
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        <Link href={homeParkHref} className="text-orange-400 hover:underline">
          Map
        </Link>
        <span className="text-zinc-600"> · </span>
        {parkName}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
        {viewerReview ? 'Edit your review' : 'Write a review'}
      </h1>

      {isLoading && !data ? (
        <p className="mt-6 text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-sm text-red-200">
          Could not load your review data. Try again from the park page.
        </p>
      ) : rolesLoading ? (
        <p className="mt-6 text-sm text-zinc-500">Checking permissions…</p>
      ) : !canWriteReview ? (
        <p className="mt-6 text-sm text-zinc-400">
          Your account role cannot post reviews yet. Ask an admin to assign the member, moderator,
          or admin role in WorkOS.
        </p>
      ) : (
        <form
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="space-y-2">
            <p id="review-rating-label" className="text-sm text-zinc-400">
              Rating
            </p>
            <StarRatingInput
              labelledBy="review-rating-label"
              value={rating}
              onChange={setRating}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="park-review-description" className="text-sm text-zinc-400">
              Review
            </label>
            <textarea
              id="park-review-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Share trail conditions, facilities, and overall ride vibe."
              className="min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus-visible:border-orange-500/60 focus-visible:ring-2 focus-visible:ring-orange-500/30"
              maxLength={2500}
              required
              disabled={submitting}
            />
          </div>
          {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">{description.trim().length}/2500</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={homeParkHref}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || description.trim().length === 0}
                className="bg-orange-600 text-white hover:bg-orange-500"
              >
                {submitting ? 'Saving…' : viewerReview ? 'Update review' : 'Post review'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
