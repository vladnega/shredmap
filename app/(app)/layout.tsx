import { AppHeader } from '@/components/app/app-header';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      {children}
    </section>
  );
}
