import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('fintrack_token');
    const userRaw = localStorage.getItem('fintrack_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('fintrack_token');
        localStorage.removeItem('fintrack_user');
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, currency = 'EUR') => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ name, email, password, currency });
      const { token, user } = res.data;
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));
