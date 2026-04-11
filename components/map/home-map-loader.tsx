'use client';

import dynamic from 'next/dynamic';

const ShredMap = dynamic(
  () => import('@/components/map/shred-map').then((mod) => mod.ShredMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="text-sm font-medium text-zinc-400">Priming the map…</p>
      </div>
    ),
  }
);

export function HomeMapLoader({
  googleMapsApiKey,
  workOsAuth,
}: {
  googleMapsApiKey: string;
  workOsAuth: boolean;
}) {
  return (
    <ShredMap googleMapsApiKey={googleMapsApiKey} workOsAuth={workOsAuth} />
  );
}
