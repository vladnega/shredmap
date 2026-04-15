import { AppHeader } from '@/components/app/app-header';
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await withAuth({ ensureSignedIn: true });

  return (
    <section className="flex h-screen flex-col bg-zinc-950">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </section>
  );
}
