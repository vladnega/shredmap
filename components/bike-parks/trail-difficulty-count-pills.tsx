import { TrailDifficultyIcon } from '@/components/bike-parks/trail-difficulty-icon';
import {
  TRAIL_DIFFICULTY_LABELS,
  TRAIL_DIFFICULTY_LEVELS,
  type TrailDifficultyCounts,
} from '@/lib/bike-parks/trail-difficulties';

export function TrailDifficultyCountPills({ counts }: { counts: TrailDifficultyCounts }) {
  const hasTrailCounts = TRAIL_DIFFICULTY_LEVELS.some((level) => counts[level] > 0);
  if (!hasTrailCounts) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Trails</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {TRAIL_DIFFICULTY_LEVELS.map((level) => (
          <li
            key={level}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-900/70 px-3 py-1.5"
          >
            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-200">
              <TrailDifficultyIcon level={level} />
              {TRAIL_DIFFICULTY_LABELS[level]}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-100">
              {counts[level]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
