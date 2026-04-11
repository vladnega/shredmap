'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain } from 'lucide-react';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { PublicAuthActions } from '@/components/auth/public-auth-actions';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';

export function MapChrome() {
  const { data: user, isLoading } = useAppUser();

  return (
    <header
      className="pointer-events-none fixed left-0 right-0 top-0 flex items-start justify-between p-3 sm:p-4"
      style={{ zIndex: MAP_UI_LAYER_Z.mapChrome }}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/90 px-4 py-2 shadow-lg shadow-black/40 backdrop-blur-md">
        <Mountain className="h-6 w-6 text-orange-500" aria-hidden />
        <span className="text-lg font-black tracking-tight text-white">
          shredmap
        </span>
      </div>

      <div className="pointer-events-auto">
        {isLoading ? (
          <div className="flex h-10 items-center gap-2">
            <div className="h-9 w-[5.5rem] animate-pulse rounded-full bg-zinc-800" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-800" />
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
          <PublicAuthActions variant="map" />
        )}
      </div>
    </header>
  );
}
