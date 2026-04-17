import { HomeMapLoader } from '@/components/map/home-map-loader';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ park?: string }>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const { park: parkFromQuery } = await searchParams;
  const initialParkId =
    typeof parkFromQuery === 'string' && parkFromQuery.length > 0 ? parkFromQuery : null;

  return <HomeMapLoader googleMapsApiKey={apiKey} initialParkId={initialParkId} />;
}
