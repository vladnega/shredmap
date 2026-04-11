import { listBikeParkMarkers } from '@/lib/db/queries';

export async function GET() {
  const parks = await listBikeParkMarkers();
  return Response.json({ parks });
}
