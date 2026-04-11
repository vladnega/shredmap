import { HomeMapLoader } from '@/components/map/home-map-loader';
import { isWorkOsConfigured } from '@/lib/auth/workos-env';

export default function HomePage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return <HomeMapLoader googleMapsApiKey={apiKey} workOsAuth={isWorkOsConfigured()} />;
}
