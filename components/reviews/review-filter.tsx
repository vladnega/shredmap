'use client';

import { Button } from '@/components/ui/button';

const ratingFilters = [5, 4, 3, 2, 1] as const;

const chipBase = 'h-7 shrink-0 gap-0.5 rounded-md px-1.5 text-xs font-medium';

export function ReviewFilter({
  selectedRating,
  onChange,
}: {
  selectedRating: number | null;
  onChange: (nextRating: number | null) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap content-start items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={selectedRating === null ? 'default' : 'outline'}
        className={`${chipBase} min-w-[2.25rem] ${
          selectedRating === null
            ? 'bg-orange-600 text-white hover:bg-orange-500'
            : 'border-zinc-700 text-zinc-300 hover:text-white'
        }`}
        onClick={() => onChange(null)}
      >
        All
      </Button>
      {ratingFilters.map((rating) => (
        <Button
          key={rating}
          type="button"
          size="sm"
          variant={selectedRating === rating ? 'default' : 'outline'}
          className={`${chipBase} min-w-[2.5rem] ${
            selectedRating === rating
              ? 'bg-orange-600 text-white hover:bg-orange-500'
              : 'border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          onClick={() => onChange(rating)}
          aria-label={`${rating} out of 5`}
        >
          <span className="inline-flex items-baseline gap-px tabular-nums leading-none">
            <span className="text-[11px] font-semibold">{rating}</span>
            <span className="text-[14px] leading-none">⭐</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
