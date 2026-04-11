'use client';

import useSWR from 'swr';
import type { User } from '@/lib/db/schema';

export async function fetchAppUser(url: string): Promise<User | null> {
  const res = await fetch(url);
  return res.json() as Promise<User | null>;
}

export function useAppUser() {
  return useSWR<User | null>('/api/user', fetchAppUser);
}
