'use client';

import type { ParkReviewItem } from '@/components/reviews/review-types';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

export function ReviewCard({
  review,
}: {
  review: ParkReviewItem;
}) {
  const createdAt = new Date(review.createdAt);

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-100">{review.reviewerDisplayName}</p>
        <p className="text-xs text-zinc-500">{dateFormatter.format(createdAt)}</p>
      </div>
      <p className="mt-1 text-sm font-medium text-amber-300">{review.rating} / 5</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
        {review.description}
      </p>
    </article>
  );
}
