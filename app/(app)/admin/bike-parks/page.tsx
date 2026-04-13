import Link from 'next/link';
import { BikeParksAdminForm } from '@/components/admin/bike-parks-admin-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isBikeParkStaffMember } from '@/lib/auth/bike-park-staff-page';
import { MapPin, ShieldAlert } from 'lucide-react';

export default async function AdminBikeParksPage() {
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Bike parks</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Create, update, or remove listings. Changes apply to the public map after refresh.
          </p>
        </div>
        <Button asChild variant="outline" className="border-zinc-600 text-zinc-200">
          <Link href="/admin">Admin home</Link>
        </Button>
      </div>

      <Card className="mt-8 border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <MapPin className="h-4 w-4 text-orange-400" />
            Park editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BikeParksAdminForm googleMapsApiKey={apiKey} />
        </CardContent>
      </Card>
    </div>
  );
}
