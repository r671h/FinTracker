'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuthStore } from '@/lib/auth';
import { accountsApi } from '@/lib/api';
import { Account } from '@/types';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/>
    </svg>
  )},
  { href: '/accounts', label: 'Accounts', icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M14 4H2a1 1 0 00-1 1v6a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1zM2 3a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H2zm6 4a1 1 0 110 2 1 1 0 010-2z"/>
    </svg>
  )},
  { href: '/transactions', label: 'Transactions', icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H2a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H2z"/>
      <path d="M0 11a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H2a2 2 0 01-2-2v-2zm2-1a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H2z"/>
    </svg>
  )},
  { href: '/import', label: 'Import CSV', icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M.5 9.9a.5.5 0 01.5.5v2.5a1 1 0 001 1h12a1 1 0 001-1v-2.5a.5.5 0 011 0v2.5a2 2 0 01-2 2H2a2 2 0 01-2-2v-2.5a.5.5 0 01.5-.5z"/>
      <path d="M7.646 1.146a.5.5 0 01.708 0l3 3a.5.5 0 01-.708.708L8.5 2.707V11.5a.5.5 0 01-1 0V2.707L5.354 4.854a.5.5 0 11-.708-.708l3-3z"/>
    </svg>
  )},
  { href: '/ai', label: 'AI Analysis', icon: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M6 12.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm-2-3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm-2-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
    </svg>
  )},
];

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(n);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    accountsApi.list().then((r) => setAccounts(r.data.accounts)).catch(() => {});
  }, []);

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-green rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 16 16">
              <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.297 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Fintrack</div>
            <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">Finance Suite</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Navigation
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx('sidebar-item', pathname === item.href && 'active')}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Accounts list */}
        {accounts.length > 0 && (
          <>
            <div className="px-3 py-2 mt-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              My Accounts
            </div>
            {accounts.map((acc) => (
              <Link
                key={acc._id}
                href="/accounts"
                className="flex items-center gap-2 px-3 py-2 mx-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.color }} />
                <span className="flex-1 text-xs font-medium text-gray-700 truncate">{acc.name}</span>
                <span className="text-[10px] font-mono text-gray-400">{fmt(acc.balance, acc.currency)}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 10-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
