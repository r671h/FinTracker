import { Transaction } from '@/types';
import { de } from 'date-fns/locale';
import React from 'react';

interface TransactionProps {
  transaction: Transaction
}

export default function TransactionRow({ transaction }: TransactionProps) {
  const isPositive = transaction.amount > 0;

  return (
    <div className="flex flex-col p-4 border-b bg-white md:table-row md:p-0 md:hover:bg-slate-50 transition-colors">
      {/* Date & Category (Mobile Header) */}
      <div className="flex justify-between items-center mb-2 md:table-cell md:p-4 md:mb-0">
        <span className="text-xs text-slate-500 font-medium md:text-sm">{transaction.date}</span>
        <span className="md:hidden bg-slate-100 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-600">
          {transaction.category}
        </span>
      </div>

      {/* description */}
      <div className="md:table-cell md:p-4 font-semibold text-slate-900">
        {transaction.description}
      </div>

      {/* Category (Desktop only) */}
      <div className="hidden md:table-cell md:p-4 text-slate-500">
        {transaction.category}
      </div>

      {/* Amount */}
      <div className={`md:table-cell md:p-4 md:text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
      </div>
    </div>
  );
};
