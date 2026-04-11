import { getBikeParkById } from '@/lib/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const park = await getBikeParkById(id);
  if (!park) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  return Response.json(park);
}
