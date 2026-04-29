'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader, Spinner } from '@/components/ui';
import { transactionsApi, accountsApi } from '@/lib/api';
import { Account } from '@/types';

interface ImportResult {
  inserted: number;
  duplicates: number;
  skipped: number;
  total: number;
  message: string;
}

export default function ImportPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data.accounts);
      if (r.data.accounts[0]) setSelectedAccount(r.data.accounts[0]._id);
    });
  }, []);

  const processFile = async (f: File) => {
    const validExt = /\.(csv|xlsx|xls)$/i.test(f.name);
    if (!validExt) { toast.error('Only CSV and Excel (.xlsx, .xls) files are supported'); return; }
    if (!selectedAccount) { toast.error('Please select an account first'); return; }
    setFile(f);
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', f);
    formData.append('accountId', selectedAccount);

    try {
      const res = await transactionsApi.import(formData);
      setResult(res.data);
      toast.success(`Imported ${res.data.inserted} transactions`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  return (
    <AppLayout>
      <PageHeader title="Import CSV" />
      <div className="p-6 max-w-xl mx-auto space-y-4">

        {/* Account selector */}
        <div className="card p-4">
          <label className="label">Import to account</label>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-400">No accounts yet. <a href="/accounts" className="text-brand-green underline">Create one first.</a></p>
          ) : (
            <select className="input" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.name} ({a.type})</option>
              ))}
            </select>
          )}
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragging ? 'border-brand-green bg-green-50' : 'border-gray-200 hover:border-brand-green hover:bg-gray-50'
          }`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-sm text-gray-500">Parsing {file?.name}…</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Drop your bank CSV or Excel file here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse · .csv, .xlsx, .xls · Max 10 MB</p>
              {file && !loading && (
                <p className="text-xs text-brand-green mt-2 font-medium">Selected: {file.name}</p>
              )}
            </>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="card p-4 border-l-4 border-brand-green">
            <div className="text-sm font-semibold text-brand-green mb-2">✓ Import complete</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xl font-semibold font-mono text-brand-green">{result.inserted}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Imported</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-semibold font-mono text-gray-500">{result.duplicates}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Duplicates</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-semibold font-mono text-gray-500">{result.skipped}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">Skipped</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-primary text-xs flex-1 justify-center" onClick={() => router.push('/dashboard')}>
                View Dashboard
              </button>
              <button className="btn text-xs flex-1 justify-center" onClick={() => router.push('/ai')}>
                Analyse with AI ↗
              </button>
            </div>
          </div>
        )}

        {/* Help card */}
        <div className="card p-4">
          <div className="text-xs font-semibold mb-2">How to export from your bank</div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Go to <strong>Statements</strong> or <strong>Transaction History</strong> in your online banking, then look for
            an <strong>Export</strong> or <strong>Download</strong> button. Choose <strong>CSV</strong> or <strong>Excel</strong> format.
            Fintrack auto-detects date, description, and amount columns from both formats.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}