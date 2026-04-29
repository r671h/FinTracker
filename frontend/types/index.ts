export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  currency: string;
  preferences?: { theme: string; language: string };
}

export interface Account {
  _id: string;
  name: string;
  type: 'current' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  color: string;
  currency: string;
  institution?: string;
  iban?: string;
  transactionCount?: number;
  createdAt: string;
}

export type Category =
  | 'groceries' | 'dining' | 'transport' | 'shopping' | 'utilities'
  | 'health' | 'entertainment' | 'income' | 'transfer' | 'savings'
  | 'housing' | 'education' | 'travel' | 'insurance' | 'other';

export interface Transaction {
  _id: string;
  account: Account | string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface TransactionStats {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    count: number;
  };
  byCategory: { _id: Category; total: number; count: number }[];
  byMonth: { _id: { year: number; month: number }; total: number }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
