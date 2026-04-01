// components/layout/dashboard-shell.tsx
import type { ReactNode } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Topbar from '@/components/layout/topbar';

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="mx-auto flex max-w-[1600px] gap-5 px-4 py-5 md:px-6 md:py-6">
        <Sidebar />
        
        <main className="min-w-0 flex-1">
          <Topbar />
          
          {/* Main Content Area */}
          <div className="rounded-xl border border-white/60 bg-white/40 p-4 backdrop-blur-sm md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}