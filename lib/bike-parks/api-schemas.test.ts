import { describe, it, expect } from 'vitest';
import {
  bikeParkCreateBodySchema,
  bikeParkPatchBodySchema,
  escapeHtmlForParkDescription,
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
});

describe('escapeHtmlForParkDescription', () => {
  it('escapes angle brackets and wraps in p', () => {
    expect(escapeHtmlForParkDescription('<script>x</script>')).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt;</p>',
    );
  });
});
