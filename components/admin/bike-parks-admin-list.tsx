'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { TranslucentLoadingOverlay } from '@/components/ui/translucent-loading-overlay';

type MarkerRow = { id: string; name: string };

const PAGE_SIZE = 40;

export function BikeParksAdminList() {
  const [parks, setParks] = useState<MarkerRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadParks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/bike-parks');
        if (!res.ok) {
          if (!active) return;
          setError(`Could not load parks (${res.status})`);
          return;
        }
        const data: unknown = await res.json();
        if (
          typeof data !== 'object' ||
          data === null ||
          !('parks' in data) ||
          !Array.isArray((data as { parks: unknown }).parks)
        ) {
          if (!active) return;
          setError('Unexpected parks list response');
          return;
        }

        const rows = (data as { parks: MarkerRow[] }).parks;
        const sortedRows = [...rows].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        );
        if (!active) return;
        setParks(sortedRows);
      } catch {
        if (!active) return;
        setError('Could not load parks');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    void loadParks();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return parks;
    return parks.filter((park) => park.name.toLowerCase().includes(q));
  }, [parks, searchTerm]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisibleCount((curr) => Math.min(curr + PAGE_SIZE, filtered.length));
      },
      { rootMargin: '400px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="bike-park-search" className="text-sm text-zinc-300 space-y-2 block">
          Search parks
        </label>
        <Input
          id="bike-park-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type a bike park name..."
          className="border-zinc-700 bg-zinc-900 text-sm leading-5 tracking-normal text-white placeholder:text-zinc-500"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? (
        <TranslucentLoadingOverlay
          overlay={false}
          label="Loading bike parks..."
          className="min-h-36 rounded-xl border border-zinc-800/80 bg-zinc-950/35"
        />
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-sm text-zinc-400">No bike parks match that search.</p>
      ) : null}

      {!error && visible.length > 0 ? (
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950/50">
          {visible.map((park) => (
            <li key={park.id}>
              <Link
                href={`/admin/bike-parks/${park.id}`}
                className="block px-4 py-3 text-sm text-zinc-100 transition hover:bg-zinc-900 hover:text-orange-300"
              >
                {park.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore ? (
        <div ref={sentinelRef} className="h-8 text-center text-xs text-zinc-500">
          Scroll to load more
        </div>
      ) : null}
    </div>
  );
}
