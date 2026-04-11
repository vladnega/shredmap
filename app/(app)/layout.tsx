import { AppHeader } from '@/components/app/app-header';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getUser } from '@/lib/db/queries';
import { isWorkOsConfigured } from '@/lib/auth/workos-env';
import { redirect } from 'next/navigation';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isWorkOsConfigured()) {
    await withAuth({ ensureSignedIn: true });
  } else {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }
  }

  return (
    <section className="flex min-h-screen flex-col bg-zinc-950">
      <AppHeader />
      {children}
    </section>
  );
}
