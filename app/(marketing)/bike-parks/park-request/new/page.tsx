import Link from 'next/link';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { ParkRequestForm } from '@/components/park-requests/park-request-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const NEW_PARK_REQUEST_PATH = '/bike-parks/park-request/new';
const SIGN_IN_HREF = `/sign-in?redirect=${encodeURIComponent(NEW_PARK_REQUEST_PATH)}`;

export default async function NewParkRequestPage() {
  const auth = await withAuth();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  if (!auth.user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">Sign in to submit a park request</CardTitle>
            <CardDescription className="text-base leading-relaxed text-zinc-300">
              To propose a new bike park, you need to be signed in. Once signed in, you can submit
              your request and we will review it. Submissions are very much welcomed, and we are
              glad you are contributing to the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-red-500"
            >
              <Link href={SIGN_IN_HREF}>Sign in to continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Park Request: Propose a New Park</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Know a UK mountain bike park missing from Shredmap? Submit it here for staff review.
      </p>
      <div className="mt-6">
        <ParkRequestForm mode="new_park" googleMapsApiKey={apiKey} />
      </div>
    </div>
  );
}
