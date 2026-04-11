import { AccountSubnav } from '@/components/app/account-subnav';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <AccountSubnav />
      {children}
    </div>
  );
}
