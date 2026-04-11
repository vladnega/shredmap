import { HomeMapLoader } from '@/components/map/home-map-loader';

export default function HomePage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return <HomeMapLoader googleMapsApiKey={apiKey} />;
}
