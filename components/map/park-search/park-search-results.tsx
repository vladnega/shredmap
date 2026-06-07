'use client';

import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import { cn } from '@/lib/utils';

export function ParkSearchResults({
  results,
  query,
  activeIndex,
  onSelect,
  onActiveIndexChange,
}: {
  results: BikeParkMapPoint[];
  query: string;
  activeIndex: number;
  onSelect: (park: BikeParkMapPoint) => void;
  onActiveIndexChange: (index: number) => void;
}) {
  const trimmed = query.trim();

  if (!trimmed) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-400" role="status">
        Type a bike park name to search
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-400" role="status">
        No bike parks match &ldquo;{trimmed}&rdquo;
      </p>
    );
  }

  return (
    <ul role="listbox" aria-label="Matching bike parks" className="max-h-64 overflow-y-auto py-1">
      {results.map((park, index) => (
        <li key={park.id} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className={cn(
              'flex w-full items-center px-3 py-2.5 text-left text-sm text-zinc-100 transition-colors',
              index === activeIndex ? 'bg-orange-600/25 text-white' : 'hover:bg-zinc-800/90',
            )}
            onMouseEnter={() => onActiveIndexChange(index)}
            onClick={() => onSelect(park)}
          >
            <span className="truncate font-medium">{park.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
