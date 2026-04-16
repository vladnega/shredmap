'use client';

import { Button } from '@/components/ui/button';
import type { ParkReviewSummary } from '@/components/reviews/review-types';

const ratingFilters = [5, 4, 3, 2, 1] as const;

export function ReviewFilter({
  selectedRating,
  summary,
  onChange,
}: {
  selectedRating: number | null;
  summary: ParkReviewSummary;
  onChange: (nextRating: number | null) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={selectedRating === null ? 'default' : 'outline'}
        className={
          selectedRating === null
            ? 'bg-orange-600 text-white hover:bg-orange-500'
            : 'border-zinc-700 text-zinc-300 hover:text-white'
        }
        onClick={() => onChange(null)}
      >
        All ({summary.totalCount})
      </Button>
      {ratingFilters.map((rating) => {
        const count = summary.ratingBuckets[String(rating) as keyof typeof summary.ratingBuckets];
        return (
          <Button
            key={rating}
            type="button"
            size="sm"
            variant={selectedRating === rating ? 'default' : 'outline'}
            className={
              selectedRating === rating
                ? 'bg-orange-600 text-white hover:bg-orange-500'
                : 'border-zinc-700 text-zinc-300 hover:text-white'
            }
            onClick={() => onChange(rating)}
          >
            {rating} star ({count})
          </Button>
        );
      })}
    </div>
  );
}
