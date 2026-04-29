// ─── StatCard ──────────────────────────────────────────────────────────────
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: 'green' | 'red' | 'gray';
}

export function StatCard({ label, value, sub, subColor = 'gray' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</div>
      <div className="text-2xl font-semibold font-mono tracking-tight">{value}</div>
      {sub && (
        <div className={clsx('text-xs mt-1', {
          'text-brand-green': subColor === 'green',
          'text-brand-red': subColor === 'red',
          'text-gray-400': subColor === 'gray',
        })}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={clsx(sz, 'border-2 border-brand-green border-t-transparent rounded-full animate-spin')} />
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <h1 className="text-base font-semibold">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-medium text-sm text-gray-600">{title}</div>
      {sub && <div className="text-xs mt-1">{sub}</div>}
    </div>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  groceries: 'bg-emerald-100 text-emerald-700',
  dining: 'bg-orange-100 text-orange-700',
  transport: 'bg-blue-100 text-blue-700',
  shopping: 'bg-purple-100 text-purple-700',
  utilities: 'bg-yellow-100 text-yellow-700',
  health: 'bg-red-100 text-red-700',
  entertainment: 'bg-indigo-100 text-indigo-700',
  income: 'bg-green-100 text-green-700',
  transfer: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-500',
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={clsx('badge', CAT_COLORS[category] || CAT_COLORS.other)}>
      {category}
    </span>
  );
}

// ─── Category emoji ───────────────────────────────────────────────────────────
const CAT_EMOJI: Record<string, string> = {
  groceries: '🛒', dining: '🍽️', transport: '🚌', shopping: '🛍️',
  utilities: '💡', health: '💊', entertainment: '🎬', income: '💰',
  transfer: '🔄', savings: '🏦', housing: '🏠', education: '📚',
  travel: '✈️', insurance: '🛡️', other: '📋',
};
export function catEmoji(cat: string) { return CAT_EMOJI[cat] || '📋'; }

// ─── Amount formatter ─────────────────────────────────────────────────────────
export function fmtAmount(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}
