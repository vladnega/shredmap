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
 * Shared signed-out action: `/sign-in` redirects to WorkOS AuthKit.
 * `?redirect=` preserves the return path.
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
    </>
  );
}
