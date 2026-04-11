import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';
import { isWorkOsConfigured } from '@/lib/auth/workos-env';
import { signToken, verifyToken } from '@/lib/auth/session';

const workosHandler = isWorkOsConfigured() ? authkitMiddleware() : null;

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (workosHandler) {
    return workosHandler(request, event);
  }

  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const protectedPrefixes = ['/dashboard', '/account', '/admin', '/chat'];
  const isProtectedRoute = protectedPrefixes.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
