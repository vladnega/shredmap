import { getOrganizationForUser } from '@/lib/db/queries';

export async function GET() {
  const organization = await getOrganizationForUser();
  return Response.json(organization);
}
