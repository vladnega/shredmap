import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogItemBySlug } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function CatalogDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);
  if (!item) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <Link
        href="/items"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← Back to catalog
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">{item.title}</h1>
      {item.description ? (
        <p className="mt-4 text-gray-600 whitespace-pre-wrap">{item.description}</p>
      ) : (
        <p className="mt-4 text-gray-500 italic">No description.</p>
      )}
    </main>
  );
}
