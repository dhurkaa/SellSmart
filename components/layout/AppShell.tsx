'use client';

import { useState } from 'react';
import PremiumSidebar from './PremiumSidebar';
import MobileNav from './MobileNav';

type AppShellProps = {
  children: React.ReactNode;
  maxWidth?: string;
};

export default function AppShell({
  children,
  maxWidth = 'max-w-[1920px]',
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <PremiumSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <MobileNav />

      <main
        className={`min-h-screen p-4 md:p-6 lg:p-8 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[92px]' : 'lg:ml-[292px]'
        }`}
      >
        <div className={`${maxWidth} mx-auto`}>
          {children}
        </div>
      </main>
    </div>
  );
}