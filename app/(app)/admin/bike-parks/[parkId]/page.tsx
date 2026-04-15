import { BikeParksAdminPageContent } from '@/app/(app)/admin/bike-parks/bike-parks-admin-page-content';

export default async function AdminBikeParkEditPage({
  params,
}: {
  params: Promise<{ parkId: string }>;
}) {
  const { parkId } = await params;
  return <BikeParksAdminPageContent mode="edit" initialParkId={parkId} />;
}
