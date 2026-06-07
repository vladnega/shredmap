'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mountain,
  LogOut,
  ShieldCheck,
  Map,
  UserRound,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(auth)/actions';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    mutate('/api/organization');
    router.push('/');
  }

  if (!user) {
    return (
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-full border border-zinc-700/80 bg-zinc-900/85 px-1.5 pr-2 text-zinc-100 shadow-sm shadow-black/25 backdrop-blur-md transition-colors hover:bg-zinc-800/90"
        >
          <Avatar className="size-7">
            <AvatarImage alt={user.name || user.email} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500/30 to-orange-700/10 text-orange-100">
              <UserRound className="h-3.5 w-3.5" />
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="ml-1 h-3.5 w-3.5 text-zinc-400" />
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/admin" className="flex w-full items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Admin</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
        <Link href="/" className="flex items-center shrink-0">
          <Mountain className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-black tracking-tight text-white">
            shredmap
          </span>
        </Link>
        <div className="order-2 sm:order-3 flex items-center justify-end shrink-0">
          <Suspense fallback={<div className="h-9 w-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
