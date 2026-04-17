import { withAuth } from '@workos-inc/authkit-nextjs';
import { MapChrome } from '@/components/map/map-chrome';

export default async function MatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await withAuth({ ensureSignedIn: true });

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950">
      <MapChrome />
      <div className="mx-auto max-w-2xl px-4 pb-12 pt-[4.75rem]">{children}</div>
    </div>
  );
}
