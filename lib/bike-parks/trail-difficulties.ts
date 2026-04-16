export const TRAIL_DIFFICULTY_LEVELS = [
  'green',
  'blue',
  'red',
  'black',
  'doubleBlack',
] as const;

export type TrailDifficultyLevel = (typeof TRAIL_DIFFICULTY_LEVELS)[number];

export type TrailDifficultyCounts = Record<TrailDifficultyLevel, number>;

export const EMPTY_TRAIL_DIFFICULTY_COUNTS: TrailDifficultyCounts = {
  green: 0,
  blue: 0,
  red: 0,
  black: 0,
  doubleBlack: 0,
};

export const TRAIL_DIFFICULTY_LABELS: Record<TrailDifficultyLevel, string> = {
  green: 'Green',
  blue: 'Blue',
  red: 'Red',
  black: 'Black',
  doubleBlack: 'Double Black',
};

export const TRAIL_DIFFICULTY_DESCRIPTIONS: Record<TrailDifficultyLevel, string> =
  {
    green:
      'Beginner trail, no features (jumps, drops, rocks etc), suitable for anyone that can ride a bike.',
    blue:
      'Intermediate flow trails with small features like rocks and roots. Suitable for riders getting into mountain biking.',
    red: 'Proficient riders only. Steeper and faster with more features, including rollable steps, drops, tables, and berms.',
    black:
      'Expert terrain with steep sections, unavoidable features, rock rolls, gap jumps, and demanding bike handling.',
    doubleBlack:
      'Pro-level terrain. Everything in black but bigger, steeper, and more technical with high commitment features.',
  };

export function sumTrailDifficultyCounts(counts: TrailDifficultyCounts): number {
  return TRAIL_DIFFICULTY_LEVELS.reduce((total, level) => total + counts[level], 0);
}
