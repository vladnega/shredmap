import Link from 'next/link';
import { ShieldAlert, GitPullRequest } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isBikeParkStaffMember } from '@/lib/auth/bike-park-staff-page';
import { ParkRequestsAdminList } from '@/components/admin/park-requests-admin-list';
import { ParkRequestReview } from '@/components/admin/park-request-review';

export async function ParkRequestsAdminPageContent({
  mode,
  requestId,
}: {
  mode: 'list' | 'detail';
  requestId?: string;
}) {
  const allowed = await isBikeParkStaffMember();
  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Access restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>Only admin or moderator users can review Park Requests.</p>
            <Button asChild variant="outline" className="border-zinc-600 text-zinc-200">
              <Link href="/account">View account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  if (mode === 'detail' && requestId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-white">Park Request review</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Review and edit the proposal before approving or rejecting.
        </p>
        <div className="mt-6">
          <ParkRequestReview requestId={requestId} googleMapsApiKey={googleMapsApiKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <GitPullRequest className="h-4 w-4 text-orange-400" />
            Park Request queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParkRequestsAdminList />
        </CardContent>
      </Card>
    </div>
  );
}
