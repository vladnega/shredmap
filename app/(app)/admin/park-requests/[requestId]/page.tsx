import { ParkRequestsAdminPageContent } from '@/app/(app)/admin/park-requests/park-requests-admin-page-content';

export default async function AdminParkRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <ParkRequestsAdminPageContent mode="detail" requestId={requestId} />;
}
