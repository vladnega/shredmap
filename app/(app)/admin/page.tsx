import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, ShieldCheck, Map } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Shredmap admin</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Centralize site operations here. This area is now aligned to the
        Shredmap product instead of generic starter content.
      </p>
      <Card className="mt-8 border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
            Access and moderation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <p>
            Restrict this route to staff roles before exposing park management
            tools in production.
          </p>
          <p>
            Add write operations behind authenticated handlers (for example,
            moderation or featured park curation).
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-4 w-4 text-orange-400" />
              Park data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>Use the map to validate park listings and spot missing entries.</p>
            <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/">Open map</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-orange-400" />
              Implementation notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>
              Build admin APIs under <code className="text-xs">/api/admin/*</code>{' '}
              and enforce role checks server-side.
            </p>
            <p>
              Add workflows for park edits, review moderation, and publication
              status changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
