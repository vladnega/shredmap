import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, MapPin, GitPullRequest } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Admin center</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Manage bike parks, review Park Requests, and more.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-orange-400" />
              Manage bike parks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>Add, edit, or delete parks (staff only).</p>
            <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/admin/bike-parks">Open bike park editor</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100 sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="h-4 w-4 text-orange-400" />
              Park Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>Review member-submitted Park Requests and apply/reject updates.</p>
            <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/admin/park-requests">Open Park Request queue</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100 sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-orange-400" />
              More
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Coming soon: Review moderation and other admin workflows can extend from here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
