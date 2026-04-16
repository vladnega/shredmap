'use client';

import type { ParkReviewSummary } from '@/components/reviews/review-types';

const ratingRows = [5, 4, 3, 2, 1] as const;

export function ReviewsSummary({
  summary,
}: {
  summary: ParkReviewSummary;
}) {
  const hasReviews = summary.totalCount > 0;
  const averageLabel = hasReviews ? summary.averageRating.toFixed(1) : '—';

  return (
    <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Community reviews
        </h3>
        <p className="text-xs text-zinc-500">
          {summary.totalCount} {summary.totalCount === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-amber-300">{averageLabel}</p>
        <p className="text-sm text-zinc-400">/ 5 average</p>
      </div>

      <ul className="mt-4 space-y-2">
        {ratingRows.map((rating) => {
          const count = summary.ratingBuckets[String(rating) as keyof typeof summary.ratingBuckets];
          const ratio = hasReviews ? Math.round((count / summary.totalCount) * 100) : 0;
          return (
            <li key={rating} className="grid grid-cols-[2.25rem_1fr_2.5rem] items-center gap-2">
              <span className="text-xs text-zinc-400">{rating} star</span>
              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-amber-400/80 transition-[width]"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <span className="text-right text-xs text-zinc-500">{count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
