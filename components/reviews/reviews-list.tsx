'use client';

import { ReviewCard } from '@/components/reviews/review-card';
import { ReviewsLoadMoreTrigger } from '@/components/reviews/reviews-load-more-trigger';
import type { ParkReviewItem } from '@/components/reviews/review-types';

export function ReviewsList({
  reviews,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  reviews: ParkReviewItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (reviews.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-400">
        No reviews yet for this filter. Be the first to share trail and facility details.
      </p>
    );
  }

  return (
    <div className="mt-4 divide-y divide-zinc-800/70">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {(hasMore || isLoadingMore) && (
        <ReviewsLoadMoreTrigger
          enabled={!isLoadingMore && hasMore}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}
