import clsx from 'clsx';
import { Transaction } from '@/types';
import { catEmoji, CategoryBadge, fmtAmount } from './index';

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionRow({ transaction: t, onDelete }: Props) {
  const account = typeof t.account === 'object' ? t.account : null;
  const pos = t.amount > 0;

  return (
    <div className="grid grid-cols-[36px_1fr_auto_auto] gap-3 items-center px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
      {/* Icon */}
      <div className={clsx(
        'w-9 h-9 rounded-lg flex items-center justify-center text-base',
        pos ? 'bg-green-50' : 'bg-gray-50'
      )}>
        {catEmoji(t.category)}
      </div>

      {/* Description + meta */}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{t.description}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <CategoryBadge category={t.category} />
          {account && (
            <span className="text-[10px] text-gray-400">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ background: account.color || '#ccc' }}
              />
              {account.name}
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="text-xs text-gray-400 text-right whitespace-nowrap">
        {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </div>

      {/* Amount + delete */}
      <div className="flex items-center gap-2 justify-end">
        <span className={clsx('text-sm font-semibold font-mono', pos ? 'text-brand-green' : 'text-brand-red')}>
          {pos ? '+' : ''}{fmtAmount(t.amount)}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(t._id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
            title="Delete transaction"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 01.5.5v1H6v-1a.5.5 0 01.5-.5zM11 2.5v-1A1.5 1.5 0 009.5 0h-3A1.5 1.5 0 005 1.5v1H2.506a.58.58 0 00-.01 0H1.5a.5.5 0 000 1h.538l.853 10.66A2 2 0 004.885 16h6.23a2 2 0 001.994-1.84l.853-10.66h.538a.5.5 0 000-1h-.995a.59.59 0 00-.01 0H11zm1.958 1l-.846 10.58a1 1 0 01-.997.92h-6.23a1 1 0 01-.997-.92L3.042 3.5h9.916z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
