import { DashboardSidebar } from '@/components/app/dashboard-sidebar';

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardSidebar>{children}</DashboardSidebar>;
}
