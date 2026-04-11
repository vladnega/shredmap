import { AppHeader } from '@/components/app/app-header';
import { withAuth } from '@workos-inc/authkit-nextjs';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await withAuth({ ensureSignedIn: true });

  return (
    <section className="flex min-h-screen flex-col bg-zinc-950">
      <AppHeader />
      {children}
    </section>
  );
}
