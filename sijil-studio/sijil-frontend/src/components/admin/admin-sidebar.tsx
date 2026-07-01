'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileJson,
  CloudUpload,
  FileText,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, href, icon, isActive }) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
};

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Ingest JSON',
      href: '/admin/ingest',
      icon: <FileJson className="h-5 w-5" />,
    },
    {
      label: 'Batch Import',
      href: '/admin/import',
      icon: <CloudUpload className="h-5 w-5" />,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: 'Performance',
      href: '/admin/performance',
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Sijil Admin
        </h1>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
};
