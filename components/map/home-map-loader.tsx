'use client';

import dynamic from 'next/dynamic';
import { TranslucentLoadingOverlay } from '@/components/ui/translucent-loading-overlay';

const ShredMap = dynamic(
  () => import('@/components/map/shred-map').then((mod) => mod.ShredMap),
  {
    ssr: false,
    loading: () => <TranslucentLoadingOverlay fullscreen label="Priming the map..." />,
  }
);

export function HomeMapLoader({
  googleMapsApiKey,
  initialParkId = null,
}: {
  googleMapsApiKey: string;
  initialParkId?: string | null;
}) {
  return <ShredMap googleMapsApiKey={googleMapsApiKey} initialParkId={initialParkId} />;
}
