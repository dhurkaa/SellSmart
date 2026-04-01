// components/layout/topbar.tsx
'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="mb-6 rounded-xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            AI Product Pricing Platform
          </h1>
          <p className="text-xs text-slate-500">
            Real-time insights for better pricing decisions
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white/80 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100">
            <UserCircleIcon className="h-8 w-8 text-slate-400" />
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              Admin User
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 