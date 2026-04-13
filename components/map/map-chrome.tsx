'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Map, Menu, Mountain, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { PublicAuthActions } from '@/components/auth/public-auth-actions';
import { MAP_UI_LAYER_Z } from '@/lib/map/map-ui-layers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(auth)/actions';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

function LoggedInMapMenu({ userName }: { userName: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    mutate('/api/organization');
    router.push('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full border border-zinc-700 bg-zinc-900/90 px-3 text-white backdrop-blur-md hover:bg-zinc-800"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-2xl border-zinc-700 bg-zinc-900/95 p-2 text-zinc-100 shadow-xl shadow-black/50 backdrop-blur-md"
      >
        <DropdownMenuLabel className="truncate px-2 py-1 text-xs uppercase tracking-wide text-zinc-400">
          {userName ?? 'Signed in'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-700/80" />
        <DropdownMenuItem className="rounded-xl px-2 py-2 text-zinc-100 focus:bg-zinc-800 focus:text-white">
          <Link href="/" className="flex w-full items-center gap-2">
            <Map className="h-4 w-4 text-orange-400" />
            <span>Map</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-2 py-2 text-zinc-100 focus:bg-zinc-800 focus:text-white">
          <Link href="/account" className="flex w-full items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-orange-400" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl px-2 py-2 text-zinc-100 focus:bg-zinc-800 focus:text-white">
          <Link href="/admin" className="flex w-full items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
            <span>Admin</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-700/80" />
        <DropdownMenuItem
          onSelect={() => {
            void handleSignOut();
          }}
          className="rounded-xl px-2 py-2 text-zinc-100 focus:bg-zinc-800 focus:text-white"
        >
          <span className="flex w-full items-center gap-2">
            <LogOut className="h-4 w-4 text-orange-400" />
            <span>Sign out</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
          <LoggedInMapMenu userName={user.name} />
        ) : (
          <PublicAuthActions variant="map" />
        )}
      </div>
    </header>
  );
}
