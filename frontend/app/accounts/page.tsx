'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader, EmptyState, fmtAmount, Spinner } from '@/components/ui';
import { accountsApi } from '@/lib/api';
import { Account } from '@/types';

const TYPES = ['current', 'savings', 'credit', 'investment', 'cash'];
const COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#D85A30', '#EF9F27', '#533AB7'];
const TYPE_STYLE: Record<string, string> = {
  current: 'bg-green-50 text-green-700',
  savings: 'bg-blue-50 text-blue-700',
  credit: 'bg-orange-50 text-orange-700',
  investment: 'bg-purple-50 text-purple-700',
  cash: 'bg-gray-100 text-gray-600',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'current', balance: '', color: COLORS[0], institution: '' });

  const load = () => {
    accountsApi.list().then((r) => setAccounts(r.data.accounts)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountsApi.create({ ...form, balance: parseFloat(form.balance) || 0 });
      toast.success('Account created');
      setShowModal(false);
      setForm({ name: '', type: 'current', balance: '', color: COLORS[0], institution: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"?`)) return;
    try {
      await accountsApi.delete(id);
      toast.success('Account archived');
      load();
    } catch { toast.error('Failed to archive'); }
  };

  return (
    <AppLayout>
      <PageHeader title="Accounts">
        <button className="btn btn-primary text-xs" onClick={() => setShowModal(true)}>+ Add</button>
      </PageHeader>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : accounts.length === 0 ? (
          <div className="card"><EmptyState icon="🏦" title="No accounts yet" sub="Add your first bank account" /></div>
        ) : (
          /* 1 col on mobile, 2 on desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div key={acc._id} className="card p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: acc.color }} />
                    <span className={clsx('badge text-[10px]', TYPE_STYLE[acc.type])}>{acc.type}</span>
                  </div>
                  <button onClick={() => handleDelete(acc._id, acc.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-xs">
                    Archive
                  </button>
                </div>
                <div className="text-2xl font-semibold font-mono tracking-tight mb-0.5">
                  {fmtAmount(acc.balance, acc.currency)}
                </div>
                <div className="text-sm text-gray-600 font-medium">{acc.name}</div>
                {acc.institution && <div className="text-xs text-gray-400 mt-0.5">{acc.institution}</div>}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Transactions</div>
                    <div className="text-sm font-semibold">{acc.transactionCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Currency</div>
                    <div className="text-sm font-semibold">{acc.currency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowModal(false)}>
          {/* Slides up from bottom on mobile, centered modal on desktop */}
          <div className="card w-full md:max-w-md p-6 rounded-t-2xl md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Add Account</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Account name</label>
                <input className="input" placeholder="e.g. Barclays Current" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Opening Balance</label>
                  <input className="input" type="number" step="0.01" placeholder="0.00" value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Institution (optional)</label>
                <input className="input" placeholder="e.g. Deutsche Bank" value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button key={c} type="button"
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95"
                      style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                      onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 justify-center">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}