"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, CreditCard, BrainCircuit } from 'lucide-react';

export default function Sidebar() {
  // 1. Logic: State to track if the sidebar is open on mobile
  const [isOpen, setIsOpen] = useState(false);

  // Helper to close sidebar when a link is clicked
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* 2. Mobile Header: Only visible on small screens (md:hidden) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white fixed top-0 w-full z-50">
        <span className="font-bold">FinanceApp</span>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 hover:bg-slate-800 rounded-md transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 3. Backdrop Overlay: Darkens the screen when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* 4. The Sidebar: Slides in from the left */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex md:flex-col
      `}>
        <div className="p-6 text-xl font-bold border-b border-slate-800 hidden md:block">
          Finance Manager
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
          <Link 
            href="/dashboard" 
            onClick={closeSidebar}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/transactions" 
            onClick={closeSidebar}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800"
          >
            <CreditCard size={20} />
            <span>Transactions</span>
          </Link>

          <Link 
            href="/ai" 
            onClick={closeSidebar}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800"
          >
            <BrainCircuit size={20} />
            <span>AI Insights</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};