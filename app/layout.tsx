import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getOrganizationForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { assertWorkOsConfigured } from '@/lib/auth/workos-env';

export const metadata: Metadata = {
  title: {
    default: 'Shredmap — UK mountain bike parks',
    template: '%s — Shredmap',
  },
  description:
    'Discover UK mountain bike parks on an interactive map. Community-driven trail intel, reviews, and park details.',
};

export const viewport: Viewport = {
  maximumScale: 1,
  themeColor: '#09090b',
};

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  assertWorkOsConfigured();

  let initialAuth: React.ComponentProps<typeof AuthKitProvider>['initialAuth'];

  try {
    const auth = await withAuth();
    const { accessToken: _accessToken, ...safe } = auth;
    initialAuth = safe;
  } catch {
    initialAuth = undefined;
  }

  const swr = (
    <SWRConfig
      value={{
        fallback: {
          '/api/user': getUser(),
          '/api/organization': getOrganizationForUser(),
        },
      }}
    >
      {children}
    </SWRConfig>
  );

  return (
    <html lang="en" className={`dark ${manrope.className}`} suppressHydrationWarning>
      <body className="min-h-[100dvh] bg-zinc-950 text-zinc-50 antialiased">
        <AuthKitProvider initialAuth={initialAuth}>{swr}</AuthKitProvider>
      </body>
    </html>
  );
}
