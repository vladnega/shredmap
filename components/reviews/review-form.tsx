'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ViewerReview } from '@/components/reviews/review-types';

type ReviewFormValues = {
  rating: number;
  description: string;
};

export function ReviewForm({
  signedIn,
  canReview,
  viewerReview,
  isSubmitting,
  onSubmit,
}: {
  signedIn: boolean;
  canReview: boolean;
  viewerReview: ViewerReview;
  isSubmitting: boolean;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!viewerReview) {
      setRating(5);
      setDescription('');
      return;
    }
    setRating(viewerReview.rating);
    setDescription(viewerReview.description);
  }, [viewerReview]);

  if (!signedIn) {
    return (
      <p className="mt-4 text-xs text-zinc-500">
        Sign in to post your review.{' '}
        <Link href="/sign-in" className="text-orange-400 hover:underline">
          Sign in
        </Link>
      </p>
    );
  }

  if (!canReview) {
    return (
      <p className="mt-4 text-xs text-zinc-500">
        Your account role cannot post reviews yet. Ask an admin to assign the
        member, moderator, or admin role in WorkOS.
      </p>
    );
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ rating, description: description.trim() });
      }}
    >
      <p className="text-sm font-semibold text-zinc-200">
        {viewerReview ? 'Edit your review' : 'Write a review'}
      </p>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <label className="text-sm text-zinc-400" htmlFor="park-review-rating">
          Rating
        </label>
        <select
          id="park-review-rating"
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          value={rating}
          onChange={(event) => setRating(Number.parseInt(event.target.value, 10))}
          disabled={isSubmitting}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
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
          className="min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus-visible:border-orange-500/60 focus-visible:ring-2 focus-visible:ring-orange-500/30"
          maxLength={2500}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">{description.trim().length}/2500</p>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || description.trim().length === 0}
          className="bg-orange-600 text-white hover:bg-orange-500"
        >
          {isSubmitting ? 'Saving...' : viewerReview ? 'Update review' : 'Post review'}
        </Button>
      </div>
    </form>
  );
}
