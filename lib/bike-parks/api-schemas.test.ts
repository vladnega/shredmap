import { describe, it, expect } from 'vitest';
import {
  bikeParkCreateBodySchema,
  bikeParkPatchBodySchema,
  escapeHtmlForParkDescription,
  parkRequestCreateBodySchema,
} from '@/lib/bike-parks/api-schemas';

describe('bikeParkCreateBodySchema', () => {
  it('requires core fields', () => {
    const r = bikeParkCreateBodySchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('accepts minimal valid body', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.trailDifficultyCounts).toEqual({
        green: 0,
        blue: 0,
        red: 0,
        black: 0,
        doubleBlack: 0,
      });
    }
  });

  it('rejects invalid website', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
      website: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });

  it('accepts https website', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
      website: 'https://example.com',
    });
    expect(r.success).toBe(true);
  });

  it('accepts explicit trail difficulty counts', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
      trailDifficultyCounts: {
        green: 1,
        blue: 2,
        red: 3,
        black: 4,
        doubleBlack: 5,
      },
    });
    expect(r.success).toBe(true);
  });

  it('accepts opening hours object', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
      openingHours: {
        monday: '09:00-17:00',
        tuesday: '09:00-17:00',
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative trail difficulty values', () => {
    const r = bikeParkCreateBodySchema.safeParse({
      name: 'Test',
      description: 'Hello',
      latitude: 51,
      longitude: -1,
      trailDifficultyCounts: {
        green: -1,
        blue: 2,
        red: 3,
        black: 4,
        doubleBlack: 5,
      },
    });
    expect(r.success).toBe(false);
  });
});

describe('bikeParkPatchBodySchema', () => {
  it('rejects empty patch', () => {
    const r = bikeParkPatchBodySchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('allows partial update', () => {
    const r = bikeParkPatchBodySchema.safeParse({ name: 'Only name' });
    expect(r.success).toBe(true);
  });

  it('allows clearing website with null', () => {
    const r = bikeParkPatchBodySchema.safeParse({ website: null });
    expect(r.success).toBe(true);
  });

  it('allows updating trail difficulty counts', () => {
    const r = bikeParkPatchBodySchema.safeParse({
      trailDifficultyCounts: {
        green: 0,
        blue: 1,
        red: 2,
        black: 3,
        doubleBlack: 4,
      },
    });
    expect(r.success).toBe(true);
  });

  it('allows clearing opening hours with null', () => {
    const r = bikeParkPatchBodySchema.safeParse({ openingHours: null });
    expect(r.success).toBe(true);
  });
});

describe('escapeHtmlForParkDescription', () => {
  it('escapes angle brackets and wraps in p', () => {
    expect(escapeHtmlForParkDescription('<script>x</script>')).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt;</p>',
    );
  });
});

describe('parkRequestCreateBodySchema', () => {
  it('accepts amendment payload', () => {
    const r = parkRequestCreateBodySchema.safeParse({
      requestType: 'amendment',
      targetParkId: '0f5e5f90-9526-4af4-b3d5-2f4d4e334f21',
      proposedPatch: {
        name: 'Updated park name',
      },
    });
    expect(r.success).toBe(true);
  });

  it('accepts new park payload', () => {
    const r = parkRequestCreateBodySchema.safeParse({
      requestType: 'new_park',
      proposedPatch: {
        name: 'New Park',
        description: 'Great riding',
        latitude: 51,
        longitude: -1,
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects amendment without target park id', () => {
    const r = parkRequestCreateBodySchema.safeParse({
      requestType: 'amendment',
      proposedPatch: {
        name: 'Updated park name',
      },
    });
    expect(r.success).toBe(false);
  });
});
