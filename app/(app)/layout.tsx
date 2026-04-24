import { AppHeader } from '@/components/app/app-header';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await withAuth();
  if (!auth.user) {
    redirect('/sign-in');
  }

  return (
    <section className="flex h-screen flex-col bg-zinc-950">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </section>
  );
}
