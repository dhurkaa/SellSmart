// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartPieIcon,
  TruckIcon,
  CubeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid 
} from '@heroicons/react/24/solid';

const navItems = [
  { href: '/', label: 'Qendra AI', icon: HomeIcon, iconSolid: HomeIconSolid },
  { href: '/pricing', label: 'Çmimet', icon: CurrencyDollarIcon, iconSolid: CurrencyDollarIconSolid },
  { href: '/sales', label: 'Shitjet', icon: ChartBarIcon },
  { href: '/reports', label: 'Raportet', icon: DocumentTextIcon },
  { href: '/market-intelligence', label: 'Tregu', icon: ChartPieIcon },
  { href: '/accounting', label: 'Kontabiliteti', icon: ClipboardDocumentListIcon },
  { href: '/imports', label: 'Importet', icon: TruckIcon },
  { href: '/products', label: 'Produktet', icon: CubeIcon },
  { href: '/inventory', label: 'Inventari', icon: ShoppingBagIcon },
  { href: '/settings', label: 'Cilësimet', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[280px] shrink-0 xl:block">
      <div className="sticky top-6 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-xl backdrop-blur-xl">
        {/* Logo Section - More Compact */}
        <div className="mb-6 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600" />
            <span className="text-lg font-black tracking-tight text-slate-900">
              SellSmart<span className="text-indigo-600">AI</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Platformë inteligjente për çmime
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {Icon && (
                  <Icon className={`
                    h-5 w-5 transition-colors
                    ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
                  `} />
                )}
                <span className={active ? 'font-semibold' : ''}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="mt-6 border-t border-slate-200/60 pt-4">
          <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 p-3">
            <p className="text-xs font-semibold text-indigo-700">Need Help?</p>
            <p className="mt-1 text-xs text-slate-600">
              Contact support or check our docs
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}