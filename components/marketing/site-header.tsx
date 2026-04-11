'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Mountain, Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(auth)/actions';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { useAppUser } from '@/lib/hooks/use-app-user';
import { PublicAuthActions } from '@/components/auth/public-auth-actions';

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user, isLoading } = useAppUser();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    mutate('/api/organization');
    router.push('/');
  }

  if (isLoading) {
    return (
      <div className="h-9 w-28 animate-pulse rounded-full bg-zinc-800" />
    );
  }

  if (!user) {
    return <PublicAuthActions variant="marketing" />;
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
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>App</span>
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

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-6">
        <Link href="/" className="flex items-center shrink-0">
          <Mountain className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-black tracking-tight text-white">
            shredmap
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/items" className="hover:text-white transition-colors">
            Catalog
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9 w-20" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
