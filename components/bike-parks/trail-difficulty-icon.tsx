import { Circle, Diamond, Square, Triangle } from 'lucide-react';
import type { TrailDifficultyLevel } from '@/lib/bike-parks/trail-difficulties';

const ICON_CLASS = 'h-4 w-4 shrink-0 stroke-[1.4] text-[darkslategray]';

export function TrailDifficultyIcon({
  level,
  className,
}: {
  level: TrailDifficultyLevel;
  className?: string;
}) {
  const cls = className ?? ICON_CLASS;

  if (level === 'green') {
    return <Circle className={`${cls} fill-emerald-500`} />;
  }
  if (level === 'blue') {
    return <Square className={`${cls} fill-sky-500`} />;
  }
  if (level === 'red') {
    return <Triangle className={`${cls} fill-rose-500`} />;
  }
  if (level === 'black') {
    return (
      <Diamond
        className={`${cls} fill-zinc-950 drop-shadow-[0_0_1px_rgba(255,255,255,0.55)]`}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <Diamond
        className={`${cls} fill-zinc-950 drop-shadow-[0_0_1px_rgba(255,255,255,0.55)]`}
      />
      <Diamond
        className={`${cls} fill-zinc-950 drop-shadow-[0_0_1px_rgba(255,255,255,0.55)]`}
      />
    </span>
  );
}
