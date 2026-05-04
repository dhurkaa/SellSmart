'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { appNavigation } from './app-navigation';

type PremiumSidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function PremiumSidebar({
  collapsed = false,
  onToggle,
}: PremiumSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-0 h-screen z-40 flex-col border-r border-white/50 bg-white/75 backdrop-blur-2xl shadow-[20px_0_60px_-35px_rgba(15,23,42,0.35)] transition-all duration-300 ${
        collapsed ? 'w-[92px]' : 'w-[292px]'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-indigo-50/80 via-white/40 to-cyan-50/70" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-6 border-b border-white/60">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-200">
              S
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xl font-black tracking-tight text-slate-950">
                  SellSmart
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  AI Business
                </div>
              </div>
            )}
          </Link>

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="h-10 w-10 shrink-0 rounded-xl bg-white/70 text-slate-500 shadow-sm border border-white/70 hover:bg-white hover:text-indigo-600 transition-all"
              aria-label="Toggle sidebar"
            >
              {collapsed ? '→' : '←'}
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
          {appNavigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-200/70'
                    : 'text-slate-600 hover:bg-white/80 hover:text-indigo-600 hover:shadow-md'
                } ${collapsed ? 'justify-center px-3' : ''}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition-all ${
                    active
                      ? 'bg-white/20'
                      : 'bg-white/70 group-hover:bg-indigo-50'
                  }`}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">
                      {item.label}
                    </span>
                    <span
                      className={`block truncate text-[11px] font-medium ${
                        active ? 'text-white/75' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                )}

                {!collapsed && active && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative p-4 border-t border-white/60">
          {!collapsed && (
            <div className="mb-4 rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-4 text-white shadow-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                Peak Mode
              </div>
              <div className="mt-1 text-lg font-black">
                Smarter pricing decisions
              </div>
              <div className="mt-2 text-xs leading-relaxed text-white/65">
                Market signals, margins, risk and AI valuation in one premium
                workspace.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-500 hover:text-white hover:shadow-lg ${
              collapsed ? 'justify-center px-3' : ''
            }`}
          >
            <span>🚪</span>
            {!collapsed && <span>Dalje</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}