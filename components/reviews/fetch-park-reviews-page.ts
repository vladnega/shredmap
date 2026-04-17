import type { ParkReviewsPageResponse } from '@/components/reviews/review-types';

export function parkReviewsSummaryListKey(bikeParkId: string): string {
  return `/api/bike-parks/${bikeParkId}/reviews?limit=1`;
}

export async function fetchParkReviewsPage(
  url: string,
): Promise<ParkReviewsPageResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load reviews (${response.status})`);
  }
  return response.json() as Promise<ParkReviewsPageResponse>;
}
