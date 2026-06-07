'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Map,
  MapPin,
  Menu,
  Mountain,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import useSWR from 'swr';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { BIKE_PARK_STAFF_ROLE_SLUGS } from '@/lib/auth/bike-park-staff-roles';
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
import { cn } from '@/lib/utils';

type WorkOsRolesPayload = { roles: string[] };

function rolesFetcher(url: string): Promise<WorkOsRolesPayload> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<WorkOsRolesPayload>;
  });
}

function isBikeParkStaffFromRoles(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  const set = new Set(roles);
  return BIKE_PARK_STAFF_ROLE_SLUGS.some((slug) => set.has(slug));
}

function LoggedInMapMenu({
  userName,
  showBikeParkAdmin,
}: {
  userName: string | null;
  showBikeParkAdmin: boolean;
}) {
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
          <Link href="/mates" className="flex w-full items-center gap-2">
            <Users className="h-4 w-4 text-orange-400" />
            <span>Mates</span>
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
        {showBikeParkAdmin ? (
          <DropdownMenuItem className="rounded-xl px-2 py-2 text-zinc-100 focus:bg-zinc-800 focus:text-white">
            <Link href="/admin/bike-parks" className="flex w-full items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              <span>Manage parks</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
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

export type MapChromeProps = {
  /** YYYY-MM-DD when signed in on the map; drives mate overlay and ride plan CTA. */
  rideDay?: string;
  onRideDayChange?: (next: string) => void;
  /** Optional map-only control rendered below the day picker (e.g. park search). */
  search?: ReactNode;
};

export function MapChrome({ rideDay, onRideDayChange, search }: MapChromeProps = {}) {
  const pathname = usePathname();
  const { data: user, isLoading } = useAppUser();
  const { data: roleData } = useSWR<WorkOsRolesPayload>(
    user ? '/api/workos/roles' : null,
    rolesFetcher,
    { revalidateOnFocus: false },
  );
  const showBikeParkAdmin = isBikeParkStaffFromRoles(roleData?.roles);

  const onMapHome = pathname === '/';
  const onMates = pathname === '/mates' || pathname.startsWith('/mates/');

  return (
    <header
      className="pointer-events-none fixed left-0 right-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4"
      style={{ zIndex: MAP_UI_LAYER_Z.mapChrome }}
    >
      <div className="pointer-events-auto flex max-w-[min(100%,28rem)] flex-col items-start gap-2 sm:max-w-none">
        <div className="flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/90 py-2 pl-3 pr-2 shadow-lg shadow-black/40 backdrop-blur-md">
          <Mountain className="h-6 w-6 shrink-0 text-orange-500" aria-hidden />
          <span className="hidden text-lg font-black tracking-tight text-white sm:inline">
            shredmap
          </span>
          <div className="flex rounded-xl bg-zinc-800/90 p-0.5">
            <Link
              href="/"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors sm:text-sm',
                onMapHome
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Map
            </Link>
            <Link
              href="/mates"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors sm:text-sm',
                onMates
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              Mates
            </Link>
          </div>
        </div>

        {user && onMapHome && rideDay !== undefined && onRideDayChange ? (
          <label className="flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/90 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Day
            </span>
            <input
              type="date"
              value={rideDay}
              onChange={(e) => onRideDayChange(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white [color-scheme:dark]"
            />
          </label>
        ) : null}

        {onMapHome && search ? search : null}
      </div>

      <div className="pointer-events-auto shrink-0">
        {isLoading ? (
          <div className="flex h-10 items-center gap-2">
            <div className="h-9 w-[5.5rem] animate-pulse rounded-full bg-zinc-800" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-800" />
          </div>
        ) : user ? (
          <LoggedInMapMenu userName={user.name} showBikeParkAdmin={showBikeParkAdmin} />
        ) : (
          <PublicAuthActions variant="map" />
        )}
      </div>
    </header>
  );
}
