import 'server-only';

import { getSignInUrl, getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { assertWorkOsConfigured } from '@/lib/auth/workos-env';

/** Safe path for AuthKit `returnTo` (open redirect protection). */
export function safeWorkOsReturnTo(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined;
  }
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return undefined;
  }
  return raw;
}

/**
 * Build WorkOS AuthKit URLs in a Route Handler or Server Action only — they set PKCE cookies.
 */
export async function getWorkOsSignInUrl(returnToRaw: string | undefined) {
  assertWorkOsConfigured();
  const returnTo = safeWorkOsReturnTo(returnToRaw);
  return getSignInUrl(returnTo ? { returnTo } : undefined);
}

export async function getWorkOsSignUpUrl(returnToRaw: string | undefined) {
  assertWorkOsConfigured();
  const returnTo = safeWorkOsReturnTo(returnToRaw);
  return getSignUpUrl(returnTo ? { returnTo } : undefined);
}
