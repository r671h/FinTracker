'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/lib/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitialising, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (isInitialising) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isInitialising, isAuthenticated]);

  if (isInitialising || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 w-full px-4 py-6 md:px-8 lg:px-12 transition-all">
        <div className="mt-12 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}