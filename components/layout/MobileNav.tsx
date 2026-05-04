'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { appNavigation } from './app-navigation';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-200">
              S
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-950">
                SellSmart
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-500">
                AI Business
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 w-11 rounded-2xl bg-white/80 border border-white/70 text-slate-700 shadow-sm flex items-center justify-center"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 h-full w-[86%] max-w-[390px] overflow-y-auto border-l border-white/50 bg-white/90 backdrop-blur-2xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-2xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-slate-950">
                  Menu
                </div>
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  SellSmart Navigation
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 font-black"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {appNavigation.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white/70 text-slate-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                        active ? 'bg-white/20' : 'bg-slate-50'
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black">
                        {item.label}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          active ? 'text-white/75' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4">
              <div className="mb-4 rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-4 text-white shadow-xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  Peak Mode
                </div>
                <div className="mt-1 text-lg font-black">
                  Premium business workspace
                </div>
                <div className="mt-2 text-xs leading-relaxed text-white/65">
                  Use AI, market signals and finance controls to make better pricing decisions.
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition-all hover:bg-red-500 hover:text-white"
              >
                <span>🚪</span>
                <span>Dalje</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}