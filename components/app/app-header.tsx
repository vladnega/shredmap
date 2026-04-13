'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mountain,
  LogOut,
  ShieldCheck,
  Map,
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
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
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
        <nav className="flex items-center gap-1 order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-start">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-zinc-200 hover:bg-zinc-800 hover:text-white"
          >
            <Link href="/">
              <Map className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Map</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-zinc-200 hover:bg-zinc-800 hover:text-white"
          >
            <Link href="/admin">
              <ShieldCheck className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </nav>
        <div className="order-2 sm:order-3 flex items-center justify-end shrink-0">
          <Suspense fallback={<div className="h-9 w-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
