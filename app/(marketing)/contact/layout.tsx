import { SiteHeader } from '@/components/marketing/site-header';

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <SiteHeader />
      {children}
    </div>
  );
}
