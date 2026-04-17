'use client';

import useSWR from 'swr';
import {
  fetchParkReviewsPage,
  parkReviewsSummaryListKey,
} from '@/components/reviews/fetch-park-reviews-page';

export function ParkReviewSummaryHeader({ bikeParkId }: { bikeParkId: string }) {
  const { data } = useSWR(parkReviewsSummaryListKey(bikeParkId), fetchParkReviewsPage, {
    revalidateOnFocus: false,
  });

  if (!data) {
    return null;
  }

  const { summary } = data;
  if (summary.totalCount === 0) {
    return <p className="mt-1 text-xs text-zinc-500">No reviews yet</p>;
  }

  return (
    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-lg font-bold tabular-nums text-amber-300">
        {summary.averageRating.toFixed(1)}
      </span>
      <span className="text-xs text-zinc-500">
        {summary.totalCount} {summary.totalCount === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  );
}
