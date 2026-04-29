'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import TransactionRow from '@/components/ui/TransactionRow';
import { StatCard, PageHeader, EmptyState, fmtAmount } from '@/components/ui';
import { transactionsApi, accountsApi } from '@/lib/api';
import { TransactionStats, Transaction, Account } from '@/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_COLOR: Record<string, string> = {
  groceries:'#1D9E75', dining:'#D85A30', transport:'#378ADD', shopping:'#7F77DD',
  utilities:'#EF9F27', health:'#E24B4A', entertainment:'#533AB7', income:'#1D9E75', other:'#9CA3AF',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionsApi.stats(),
      transactionsApi.list({ limit: 8 }),
      accountsApi.list(),
    ]).then(([s, t, a]) => {
      setStats(s.data);
      setRecent(t.data.transactions);
      setAccounts(a.data.accounts);
    }).finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const s = stats?.summary;

  const monthlyData = (stats?.byMonth || []).map((m) => ({
    name: MONTH_NAMES[m._id.month - 1],
    amount: m.total,
  }));

  return (
    <AppLayout>
      <PageHeader title="Dashboard">
        <Link href="/import" className="btn btn-primary text-xs">+ Import CSV</Link>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Balance" value={fmtAmount(totalBalance)} sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} />
          <StatCard label="Income" value={fmtAmount(s?.totalIncome || 0)} sub="↑ all time" subColor="green" />
          <StatCard label="Expenses" value={fmtAmount(Math.abs(s?.totalExpenses || 0))} sub="↓ all time" subColor="red" />
          <StatCard
            label="Net Savings"
            value={fmtAmount((s?.totalIncome || 0) + (s?.totalExpenses || 0))}
            sub="income − expenses"
            subColor={(s?.totalIncome || 0) + (s?.totalExpenses || 0) >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Monthly bar chart */}
          <div className="card p-4">
            <div className="text-sm font-semibold mb-4">Monthly Spending</div>
            {monthlyData.length === 0 ? (
              <EmptyState icon="📊" title="No spending data yet" sub="Import a CSV to get started" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v: number) => [fmtAmount(v), 'Spending']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill={i === monthlyData.length - 1 ? '#1D9E75' : '#D1FAE5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top categories */}
          <div className="card p-4">
            <div className="text-sm font-semibold mb-4">Top Categories</div>
            {(stats?.byCategory || []).length === 0 ? (
              <EmptyState icon="🏷️" title="No category data yet" />
            ) : (
              <div className="space-y-2.5">
                {(stats?.byCategory || []).slice(0, 6).map((c) => {
                  const total = stats!.byCategory.reduce((s, x) => s + x.total, 0) || 1;
                  return (
                    <div key={c._id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLOR[c._id] || '#9CA3AF' }} />
                      <div className="flex-1 text-xs font-medium capitalize">{c._id}</div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(c.total / total) * 100}%`, background: CAT_COLOR[c._id] || '#9CA3AF' }}
                        />
                      </div>
                      <div className="text-xs font-mono text-gray-500 w-16 text-right">{fmtAmount(c.total)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-semibold">Recent Transactions</div>
            <Link href="/transactions" className="text-xs text-gray-400 hover:text-brand-green transition-colors">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon="💳" title="No transactions yet" sub="Import a bank CSV to see your history" />
          ) : (
            recent.map((t) => <TransactionRow key={t._id} transaction={t} />)
          )}
        </div>
      </div>
    </AppLayout>
  );
}
