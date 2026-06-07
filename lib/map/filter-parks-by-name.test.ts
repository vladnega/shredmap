import { describe, expect, it } from 'vitest';
import { filterParksByName } from '@/lib/map/filter-parks-by-name';
import type { BikeParkMapPoint } from '@/lib/bike-parks/fetch-bike-parks-for-map';

const parks: BikeParkMapPoint[] = [
  { id: '1', name: 'Bike Park Alpha', lat: 51, lng: -1 },
  { id: '2', name: 'Beta Trails', lat: 52, lng: -2 },
  { id: '3', name: 'alphabet soup', lat: 53, lng: -3 },
];

describe('filterParksByName', () => {
  it('returns empty array for blank query', () => {
    expect(filterParksByName(parks, '')).toEqual([]);
    expect(filterParksByName(parks, '   ')).toEqual([]);
  });

  it('matches case-insensitively and sorts by name', () => {
    expect(filterParksByName(parks, 'alpha')).toEqual([
      parks[2],
      parks[0],
    ]);
  });

  it('respects the result limit', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `Park ${i}`,
      lat: 51,
      lng: -1,
    }));
    expect(filterParksByName(many, 'park', 5)).toHaveLength(5);
  });
});
