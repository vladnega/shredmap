import Link from 'next/link';
import type { Metadata } from 'next';
import { getBikeParkById } from '@/lib/db/queries';
import { BikeParkReviewEditor } from '@/components/reviews/bike-park-review-editor';

type PageProps = {
  params: Promise<{ parkId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { parkId } = await params;
  const park = await getBikeParkById(parkId);
  if (!park) {
    return { title: 'Review' };
  }
  return { title: `Review — ${park.name}` };
}

export default async function BikeParkReviewPage({ params }: PageProps) {
  const { parkId } = await params;
  const park = await getBikeParkById(parkId);
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

  return <BikeParkReviewEditor parkId={park.id} parkName={park.name} />;
}
