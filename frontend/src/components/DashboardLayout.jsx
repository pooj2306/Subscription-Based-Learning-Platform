import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout({ children, isDemo = false }) {
  // Persistent sidebar open/close state, defaults to true on desktop (>= 1024px)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sblp_sidebar_open');
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sblp_sidebar_open', String(next));
      return next;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('sblp_sidebar_open', 'false');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Collapsible Sidebar Wrapper */}
      <div
        className={`fixed lg:sticky top-0 z-40 lg:z-20 min-h-screen transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen
            ? 'translate-x-0 w-64 opacity-100'
            : '-translate-x-full w-0 opacity-0 overflow-hidden lg:w-0'
        }`}
      >
        <Sidebar isDemo={isDemo} onClose={closeSidebar} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <DashboardHeader
          isDemo={isDemo}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}