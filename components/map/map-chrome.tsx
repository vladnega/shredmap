'use client';

import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Mountain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MapChromeWithWorkOs() {
  const { user, loading, refreshAuth } = useAuth();

  return (
    <>
      {loading ? (
        <div className="flex h-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/90 px-4">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        </div>
      ) : user ? (
        <Button
          asChild
          variant="secondary"
          className="rounded-full border border-zinc-700 bg-zinc-900/90 font-semibold text-white backdrop-blur-md hover:bg-zinc-800"
        >
          <Link href="/dashboard">Account</Link>
        </Button>
      ) : (
        <Button
          type="button"
          className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-red-500"
          onClick={() => void refreshAuth({ ensureSignedIn: true })}
        >
          Sign in
        </Button>
      )}
    </>
  );
}

export function MapChrome({ workOsAuth }: { workOsAuth: boolean }) {
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-start justify-between p-3 sm:p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/90 px-4 py-2 shadow-lg shadow-black/40 backdrop-blur-md">
        <Mountain className="h-6 w-6 text-orange-500" aria-hidden />
        <span className="text-lg font-black tracking-tight text-white">
          shredmap
        </span>
      </div>

      <div className="pointer-events-auto">
        {workOsAuth ? (
          <MapChromeWithWorkOs />
        ) : (
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-red-500"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
