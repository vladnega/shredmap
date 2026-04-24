import { parkRequestStatusSchema } from '@/lib/bike-parks/api-schemas';
import { requireBikeParkStaff } from '@/lib/auth/bike-park-staff';
import { listBikeParkRequests } from '@/lib/db/queries';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getProposedParkName(proposedPatch: unknown): string | null {
  if (!isRecord(proposedPatch)) {
    return null;
  }
  const candidate = proposedPatch['name'];
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: Request) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get('status');
  const parsedStatus = statusRaw
    ? parkRequestStatusSchema.safeParse(statusRaw)
    : null;
  if (statusRaw && !parsedStatus?.success) {
    return Response.json({ error: 'Invalid status filter' }, { status: 400 });
  }

  const requests = await listBikeParkRequests({
    status: parsedStatus?.success ? parsedStatus.data : undefined,
  });

  const requestsWithParkName = requests.map((item) => ({
    ...item,
    parkName: item.targetParkName ?? getProposedParkName(item.proposedPatch),
  }));

  return Response.json({ requests: requestsWithParkName });
}
