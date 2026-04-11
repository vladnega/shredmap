import Link from 'next/link';
import { listCatalogItems } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function CatalogListPage() {
  const items = await listCatalogItems();

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>
      <p className="mt-2 text-gray-600">
        Example listings backed by the <code className="text-sm">catalog_items</code>{' '}
        table—swap for your domain model.
      </p>
      <ul className="mt-10 space-y-4">
        {items.length === 0 ? (
          <li className="text-gray-500">No items yet. Run the seed script.</li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.slug}`}
                className="text-lg font-medium text-orange-600 hover:text-orange-700"
              >
                {item.title}
              </Link>
              {item.description ? (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
