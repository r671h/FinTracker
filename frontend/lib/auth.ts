import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialising: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialising: true,
  isAuthenticated: false,

  init: () => {
    if (!get().isInitialising) return;
    if (typeof window === 'undefined') { set({ isInitialising: false }); return; }

    const token = localStorage.getItem('fintrack_token');
    const userRaw = localStorage.getItem('fintrack_user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        set({ token, user, isAuthenticated: true, isInitialising: false });
        return;
      } catch {}
      localStorage.removeItem('fintrack_token');
      localStorage.removeItem('fintrack_user');
    }
    set({ isInitialising: false });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err; 
    }
  },

  register: async (name, email, password, currency = 'EUR') => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ name, email, password, currency });
      const { token, user } = res.data;
      localStorage.setItem('fintrack_token', token);
      localStorage.setItem('fintrack_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    set({ user: null, token: null, isAuthenticated: false, isInitialising: false });
    window.location.replace('/login');
  },
}));