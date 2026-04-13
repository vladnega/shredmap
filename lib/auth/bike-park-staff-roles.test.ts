import { describe, it, expect } from 'vitest';
import { userCanManageBikeParks } from '@/lib/auth/bike-park-staff-roles';

describe('userCanManageBikeParks', () => {
  it('allows admin and moderator', () => {
    expect(userCanManageBikeParks(new Set(['admin']))).toBe(true);
    expect(userCanManageBikeParks(new Set(['moderator']))).toBe(true);
  });

  it('denies other roles', () => {
    expect(userCanManageBikeParks(new Set(['owner']))).toBe(false);
    expect(userCanManageBikeParks(new Set(['member']))).toBe(false);
    expect(userCanManageBikeParks(new Set())).toBe(false);
  });
});
