import { AppHeader } from '@/components/app/app-header';
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await withAuth({ ensureSignedIn: true });

  return (
    <section className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      <AppHeader />
      {children}
    </section>
  );
}
