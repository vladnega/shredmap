import type { NextRequest, NextFetchEvent } from 'next/server';
import { authkitProxy } from '@workos-inc/authkit-nextjs';
import { assertWorkOsConfigured } from '@/lib/auth/workos-env';

assertWorkOsConfigured();

const handler = authkitProxy({
  signUpPaths: ['/sign-up'],
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handler(request, event);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
