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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <GitPullRequest className="h-4 w-4 text-orange-400" />
            {mode === 'list' ? 'Park Request queue' : 'Park Request review'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === 'list' ? <ParkRequestsAdminList /> : requestId ? <ParkRequestReview requestId={requestId} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
