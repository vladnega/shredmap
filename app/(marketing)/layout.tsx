import { SiteHeader } from '@/components/marketing/site-header';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      {children}
    </div>
  );
}
