export type ParkReviewSummary = {
  totalCount: number;
  averageRating: number;
  ratingBuckets: Record<'1' | '2' | '3' | '4' | '5', number>;
};

export type ParkReviewItem = {
  id: number;
  rating: number;
  description: string;
  createdAt: string;
  reviewerDisplayName: string;
};

export type ViewerReview = {
  id: number;
  rating: number;
  description: string;
  createdAt: string;
} | null;

export type ParkReviewsPageResponse = {
  summary: ParkReviewSummary;
  items: ParkReviewItem[];
  nextCursor: number | null;
  viewerReview: ViewerReview;
};
