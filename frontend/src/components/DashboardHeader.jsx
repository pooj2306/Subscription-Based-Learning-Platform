import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function DashboardHeader({ isDemo = false, isSidebarOpen = true, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const isActuallyAuthenticated = Boolean(user && !isDemo);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Section: Sidebar Toggle & Breadcrumb or Brand indicator */}
        <div className="flex items-center gap-3">
          {/* Sidebar Open/Close Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              className="p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}

          {isDemo ? (
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
              >
                <span>←</span>
                <span>Landing Page</span>
              </Link>
              <span className="text-gray-300 dark:text-slate-700">|</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-brand-600 dark:text-indigo-300 border border-brand-200/60 dark:border-indigo-800">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                Demo Mode
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 font-medium">
              <span className="text-gray-400 dark:text-slate-500">Welcome,</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.username}</span>
            </div>
          )}
        </div>

        {/* Right Section: Theme Toggle, Help Desk, Profile or Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <span className="text-lg leading-none" role="img" aria-label="Sun">☀️</span>
            ) : (
              <span className="text-lg leading-none" role="img" aria-label="Moon">🌙</span>
            )}
          </button>

          {/* Help Desk Link */}
          <Link
            to={isActuallyAuthenticated ? '/student/help' : '/help'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <span>❓</span>
            <span className="hidden sm:inline">Help Desk</span>
          </Link>

          {/* Conditional rendering based on authenticaton */}
          {isActuallyAuthenticated ? (
            /* Authenticated Student Controls in Top-Right */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.username?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {user?.username}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 capitalize">
                    {user?.role?.toLowerCase() || 'Student'}
                  </span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-gray-400 dark:text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.username}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/student"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <span>🏠</span>
                      <span>My Profile & Dashboard</span>
                    </Link>
                    <Link
                      to="/student/plans"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <span>⚙️</span>
                      <span>Account Settings & Plans</span>
                    </Link>
                    <Link
                      to="/student/help"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <span>💬</span>
                      <span>Help & Support</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer text-left"
                    >
                      <span>🚪</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Demo / Unauthenticated Mode Header Controls */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition"
              >
                Register for Free
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl mx-auto mb-4">
              🚪
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Confirm Logout
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to log out of your student session? You can log back in at any time to resume where you left off.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
