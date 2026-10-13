import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: '🏠' },
    { to: '/student/analytics', label: 'Analytics & Readiness', icon: '📈' },
    { to: '/student/roadmaps', label: 'Skill Roadmaps', icon: '🗺️' },
    { to: '/student/leaderboard', label: 'Leaderboard & XP', icon: '🏆' },
    { to: '/student/study-groups', label: 'Study Groups', icon: '👥' },
    { to: '/student/topic-strengths', label: 'Topic Strengths', icon: '📊' },
    { to: '/student/spaced-repetition', label: 'Spaced Review', icon: '🔁' },
    { to: '/student/plans', label: 'Subscription', icon: '💳' },
    { to: '/student/certificates', label: 'Certificates', icon: '🎓' },
    { to: '/student/help', label: 'Help Desk', icon: '❓' },
  ],
  INSTRUCTOR: [
    { to: '/instructor', label: 'My Courses', icon: '📚' },
    { to: '/instructor/analytics', label: 'Drop-off & Missed Questions', icon: '📉' },
    { to: '/instructor/courses/new', label: 'Add Course', icon: '➕' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Overview', icon: '📊' },
  ],
};

export default function Sidebar({ isDemo = false, onClose }) {
  const { user } = useAuth();
  const currentRole = user?.role || (isDemo ? 'STUDENT' : null);
  const items = NAV_ITEMS[currentRole] || NAV_ITEMS.STUDENT;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 min-h-screen flex flex-col sticky top-0 transition-colors shadow-lg lg:shadow-none">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            S
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">SBLP</h1>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5 capitalize">
              {isDemo ? 'Demo Preview' : `${(user?.role || 'student').toLowerCase()} Panel`}
            </p>
          </div>
        </div>

        {/* Close Sidebar Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const targetUrl = isDemo && item.to === '/student' ? '/demo' : item.to;
          return (
            <NavLink
              key={item.to}
              to={targetUrl}
              end={item.to === '/student' || item.to === '/instructor' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-200 dark:shadow-none'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Subtle footer watermark without profile/logout */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center font-medium">
          Adapt & Learn Platform • 2026
        </p>
      </div>
    </aside>
  );
}