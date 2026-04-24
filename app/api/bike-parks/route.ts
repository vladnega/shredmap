import { randomUUID } from 'node:crypto';
import {
  bikeParkCreateBodySchema,
  escapeHtmlForParkDescription,
} from '@/lib/bike-parks/api-schemas';
import { selectedFacilitiesToAmenities } from '@/lib/bike-parks/facilities';
import { requireBikeParkStaff } from '@/lib/auth/bike-park-staff';
import { insertBikePark, listBikeParkMarkers } from '@/lib/db/queries';

export async function GET() {
  const parks = await listBikeParkMarkers();
  return Response.json({ parks });
}

export async function POST(request: Request) {
  const staff = await requireBikeParkStaff();
  if (!staff.ok) {
    return staff.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bikeParkCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    name,
    description,
    latitude,
    longitude,
    website,
    buyTicketUrl,
    payment,
    logoUrl,
    pinLogoUrl,
    facilities,
    trailDifficultyCounts,
    openingHours,
  } =
    parsed.data;

  const row = await insertBikePark({
    id: randomUUID(),
    name,
    description: escapeHtmlForParkDescription(description),
    latitude,
    longitude,
    primaryCtaUrl: website ?? null,
    buyTicketUrl: buyTicketUrl ?? null,
    payment,
    logoUrl: logoUrl ?? null,
    pinLogoUrl: pinLogoUrl ?? null,
    amenities: selectedFacilitiesToAmenities(facilities),
    trailDifficultyCounts,
    openingHours: openingHours ?? null,
  });

  if (!row) {
    return Response.json({ error: 'Could not create park' }, { status: 500 });
  }

  return Response.json(row, { status: 201 });
}
