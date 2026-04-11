'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/account', label: 'Profile' },
  { href: '/account/security', label: 'Security' },
];

export function AccountSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b border-gray-200 pb-4 mb-8">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium pb-2 border-b-2 -mb-px transition-colors',
            pathname === link.href
              ? 'border-orange-500 text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
