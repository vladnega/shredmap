import { listCatalogItems } from '@/lib/db/queries';

export async function GET() {
  const items = await listCatalogItems();
  return Response.json(items);
}
