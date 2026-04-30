'use client';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import TransactionRow from '@/components/ui/TransactionRow';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { transactionsApi, accountsApi } from '@/lib/api';
import { Transaction, Account, Pagination } from '@/types';

const CATEGORIES = [
  'groceries','dining','transport','shopping','utilities',
  'health','entertainment','income','transfer','savings',
  'housing','education','travel','insurance','other',
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [type, setType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback((p = 1) => {
    setLoading(true);
    transactionsApi.list({ page: p, limit: 25, search: search || undefined, category: category || undefined, account: account || undefined, type: type || undefined })
      .then((r) => { setTransactions(r.data.transactions); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  }, [search, category, account, type]);

  useEffect(() => { accountsApi.list().then((r) => setAccounts(r.data.accounts)); }, []);
  useEffect(() => { setPage(1); load(1); }, [search, category, account, type]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsApi.delete(id);
      toast.success('Transaction deleted');
      load(page);
    } catch { toast.error('Delete failed'); }
  };

  const hasFilters = search || category || account || type;

  return (
    <AppLayout>
      <PageHeader title="Transactions">
        <button className="btn text-xs" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide filters' : 'Filter'}
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-green ml-1" />}
        </button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-4">
        {/* Filters — collapsible on mobile */}
        {showFilters && (
          <div className="card p-4 space-y-3 md:space-y-0 md:flex md:gap-2 md:flex-wrap">
            <input className="input md:max-w-xs text-sm" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            <select className="input md:w-40 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input md:w-44 text-sm" value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
            <select className="input md:w-36 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            {hasFilters && (
              <button className="btn text-xs w-full md:w-auto justify-center"
                onClick={() => { setSearch(''); setCategory(''); setAccount(''); setType(''); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        <div className="card overflow-hidden">
          {/* Header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[36px_1fr_auto_auto] gap-3 px-4 py-2 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            <div />
            <div>Description</div>
            <div className="text-right">Date</div>
            <div className="text-right pr-6">Amount</div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : transactions.length === 0 ? (
            <EmptyState icon="🔍" title="No transactions found" sub="Try adjusting your filters" />
          ) : (
            transactions.map((t) => <TransactionRow key={t._id} transaction={t} onDelete={handleDelete} />)
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="text-xs">{pagination.total} total</span>
            <div className="flex gap-1">
              <button className="btn text-xs" disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load(p); }}>← Prev</button>
              <span className="px-3 py-1.5 text-xs font-medium">{page} / {pagination.pages}</span>
              <button className="btn text-xs" disabled={page >= pagination.pages}
                onClick={() => { const p = page + 1; setPage(p); load(p); }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}