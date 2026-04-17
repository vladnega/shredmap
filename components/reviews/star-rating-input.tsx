'use client';

import { useState } from 'react';

const STAR = '⭐';
const LEVELS = [1, 2, 3, 4, 5] as const;

export function StarRatingInput({
  value,
  onChange,
  disabled,
  labelledBy,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  labelledBy?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHover(null);
        }
      }}
    >
      {LEVELS.map((level) => {
        const lit = level <= active;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            aria-label={`${level} out of 5`}
            aria-pressed={value === level}
            className="rounded-md p-0.5 transition-opacity disabled:opacity-40"
            onMouseEnter={() => setHover(level)}
            onFocus={() => setHover(level)}
            onClick={() => onChange(level)}
          >
            <span
              className={`block text-2xl leading-none transition-[opacity,color] sm:text-[1.75rem] ${
                lit
                  ? 'text-amber-300 opacity-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                  : 'text-amber-200/90 opacity-[0.22]'
              }`}
            >
              {STAR}
            </span>
          </button>
        );
      })}
    </div>
  );
}
