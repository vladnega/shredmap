import Link from 'next/link';
import { BikeParksAdminList } from '@/components/admin/bike-parks-admin-list';
import { BikeParksAdminForm } from '@/components/admin/bike-parks-admin-form';
import { BackToDirectoryButton } from '@/components/admin/back-to-directory-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ShieldAlert } from 'lucide-react';
import { isBikeParkStaffMember } from '@/lib/auth/bike-park-staff-page';

export async function BikeParksAdminPageContent({
  mode,
  initialParkId,
}: {
  mode: 'list' | 'edit';
  initialParkId?: string;
}) {
  const allowed = await isBikeParkStaffMember();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

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
            <p>
              Only WorkOS users with the <strong className="text-zinc-100">admin</strong> or{' '}
              <strong className="text-zinc-100">moderator</strong> role can manage bike parks.
            </p>
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
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <MapPin className="h-4 w-4 text-orange-400" />
            {mode === 'list' ? 'Park directory' : 'Park editor'}
          </CardTitle>
          {mode === 'edit' ? <BackToDirectoryButton /> : null}
        </CardHeader>
        <CardContent>
          {mode === 'list' ? (
            <BikeParksAdminList />
          ) : (
            <BikeParksAdminForm googleMapsApiKey={apiKey} initialParkId={initialParkId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
