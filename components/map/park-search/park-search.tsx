'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { MapPinSearch, X } from 'lucide-react';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';
import { filterParksByName } from '@/lib/map/filter-parks-by-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ParkSearchResults } from '@/components/map/park-search/park-search-results';

export type ParkSearchProps = {
  parks: readonly BikeParkMapPoint[];
  onSelectPark: (park: BikeParkMapPoint) => void;
  disabled?: boolean;
};

export function ParkSearch({ parks, onSelectPark, disabled = false }: ParkSearchProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => filterParksByName(parks, query), [parks, query]);

  const openSearch = useCallback(() => {
    setExpanded(true);
  }, []);

  const closeSearch = useCallback(() => {
    setExpanded(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: MouseEvent) {
      const node = containerRef.current;
      if (!node?.contains(event.target as Node)) {
        closeSearch();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeSearch();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSearch, expanded]);

  function handleSelect(park: BikeParkMapPoint) {
    onSelectPark(park);
    closeSearch();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const park = results[activeIndex];
      if (park) handleSelect(park);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'overflow-hidden border border-zinc-800/80 bg-zinc-950/90 shadow-lg shadow-black/40 backdrop-blur-md transition-[width,border-radius] duration-200 ease-out',
          expanded
            ? 'w-[min(calc(100vw-2rem),20rem)] rounded-2xl'
            : 'w-10 rounded-full',
        )}
      >
        {!expanded ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={disabled}
            className="h-10 w-10 rounded-full border-0 bg-transparent text-white hover:bg-zinc-800/80"
            aria-label="Search bike parks"
            aria-expanded={false}
            onClick={openSearch}
          >
            <MapPinSearch className="h-5 w-5 text-orange-400" />
          </Button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1.5">
            <MapPinSearch className="ml-1 h-4 w-4 shrink-0 text-orange-400" aria-hidden />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search parks…"
              role="combobox"
              aria-expanded
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-label="Search bike parks by name"
              autoComplete="off"
              className="h-8 flex-1 border-0 bg-transparent px-1 text-sm text-white shadow-none placeholder:text-zinc-500 focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border-0 bg-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {expanded ? (
          <div
            id={listboxId}
            className="border-t border-zinc-800/80"
          >
            <ParkSearchResults
              results={results}
              query={query}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onActiveIndexChange={setActiveIndex}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
