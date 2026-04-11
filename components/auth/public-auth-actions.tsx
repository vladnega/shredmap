'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

/** `?redirect=` for post-login return; pathname-only to avoid Suspense for `useSearchParams`. */
function useAuthReturnQuery() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') {
    return '';
  }
  return `?redirect=${encodeURIComponent(pathname)}`;
}

/**
 * Shared signed-out actions: `/sign-in` and `/sign-up` immediately redirect to WorkOS
 * AuthKit; `?redirect=` preserves the return path.
 */
export function PublicAuthActions({
  variant,
}: {
  variant: 'map' | 'marketing';
}) {
  const q = useAuthReturnQuery();

  if (variant === 'map') {
    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-red-500"
        >
          <Link href={`/sign-in${q}`}>Sign in</Link>
        </Button>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="rounded-full border border-zinc-600 bg-zinc-900/90 font-semibold text-white backdrop-blur-md hover:bg-zinc-800"
        >
          <Link href={`/sign-up${q}`}>Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/sign-in${q}`}
        className="text-sm font-medium text-zinc-300 hover:text-white"
      >
        Sign in
      </Link>
      <Button asChild className="rounded-full">
        <Link href={`/sign-up${q}`}>Sign up</Link>
      </Button>
    </>
  );
}
