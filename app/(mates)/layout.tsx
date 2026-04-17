import Link from 'next/link';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { MapChrome } from '@/components/map/map-chrome';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const RETURN_TO_MATES = '/mates';
const MATES_SIGN_IN_HREF = `/sign-in?redirect=${encodeURIComponent(RETURN_TO_MATES)}`;
const MATES_SIGN_UP_HREF = `/sign-up?redirect=${encodeURIComponent(RETURN_TO_MATES)}`;

export default async function MatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await withAuth();

  if (!auth.user) {
    return (
      <div className="relative min-h-[100dvh] bg-zinc-950">
        <MapChrome />
        <div className="mx-auto max-w-2xl px-4 pb-12 pt-[4.75rem]">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-white">Mates</CardTitle>
              <CardDescription className="text-base leading-relaxed text-zinc-300">
                To see your mates, share invite links, and show up on each other&apos;s map, you need
                to be signed in. Don&apos;t have an account yet? Create one — it only takes a moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                className="bg-gradient-to-r from-orange-600 to-red-600 font-bold text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-red-500"
              >
                <Link href={MATES_SIGN_IN_HREF}>Sign in</Link>
              </Button>
              <Button asChild variant="secondary" className="border-zinc-600 bg-zinc-800 font-semibold text-white hover:bg-zinc-700">
                <Link href={MATES_SIGN_UP_HREF}>Create account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950">
      <MapChrome />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-[4.75rem]">{children}</div>
    </div>
  );
}
