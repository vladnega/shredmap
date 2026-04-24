import Link from 'next/link';
import { ParkRequestForm } from '@/components/park-requests/park-request-form';
import { getBikeParkById } from '@/lib/db/queries';

export default async function ParkAmendmentRequestPage({
  params,
}: {
  params: Promise<{ parkId: string }>;
}) {
  const { parkId } = await params;
  const park = await getBikeParkById(parkId);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  if (!park) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold text-white">Park not found</h1>
        <p className="mt-2 text-sm text-zinc-400">This bike park does not exist or was removed.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-orange-400 hover:underline">
          Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Park Request: Amend {park.name}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Submit a Park Request for this listing. Staff reviewers can edit your proposal before
        approval.
      </p>
      <div className="mt-6">
        <ParkRequestForm mode="amendment" targetPark={park} googleMapsApiKey={apiKey} />
      </div>
    </div>
  );
}
