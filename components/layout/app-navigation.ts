export type AppNavigationItem = {
  href: string;
  label: string;
  icon: string;
  description?: string;
};

export const appNavigation: AppNavigationItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Qendra kryesore',
  },
  {
    href: '/pricing',
    label: 'Çmimet',
    icon: '💰',
    description: 'Strategjitë e çmimeve',
  },
  {
    href: '/sales',
    label: 'Shitjet',
    icon: '📊',
    description: 'Performanca e shitjeve',
  },
  {
    href: '/reports',
    label: 'Raportet',
    icon: '📑',
    description: 'Analiza dhe eksportime',
  },
  {
    href: '/market-intelligence',
    label: 'Tregu',
    icon: '📡',
    description: 'Sinjalet e konkurrencës',
  },
  {
    href: '/sync-logs',
    label: 'Sync Logs',
    icon: '🛰️',
    description: 'Website scan history',
  },
  {
    href: '/accounting',
    label: 'Kontabiliteti',
    icon: '🧾',
    description: 'Kostot dhe financat',
  },
  {
    href: '/imports',
    label: 'Importet',
    icon: '🚢',
    description: 'Mallrat dhe furnizimi',
  },
  {
    href: '/products',
    label: 'Produktet',
    icon: '📦',
    description: 'Menaxhimi i produkteve',
  },
  {
    href: '/inventory',
    label: 'Inventari',
    icon: '🏪',
    description: 'Gjendja e stokut',
  },
  {
  href: '/tutorial',
  label: 'Tutorial',
  icon: '📘',
  description: 'How the system works',
},
  {
    href: '/settings',
    label: 'Cilësimet',
    icon: '⚙️',
    description: 'Preferencat e llogarisë',
  },
];