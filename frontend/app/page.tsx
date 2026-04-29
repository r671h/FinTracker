'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitialising, init } = useAuthStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (isInitialising) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isInitialising, isAuthenticated]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
}