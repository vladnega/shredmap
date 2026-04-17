const STAR = '⭐';

/** Whole-number ratings 0–5 rendered as repeated star emoji. */
export function ratingStarsEmoji(rating: number): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return STAR.repeat(n);
}
