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
}: {
  googleMapsApiKey: string;
}) {
  return <ShredMap googleMapsApiKey={googleMapsApiKey} />;
}
