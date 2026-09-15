import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: '🏠' },
    { to: '/student/plans', label: 'Subscription', icon: '💳' },
    { to: '/student/certificates', label: 'Certificates', icon: '🎓' },
  ],
  INSTRUCTOR: [
    { to: '/instructor', label: 'My Courses', icon: '📚' },
    { to: '/instructor/courses/new', label: 'Add Course', icon: '➕' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Overview', icon: '📊' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col sticky top-0">
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">SBLP</h1>
            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{user?.role?.toLowerCase()} Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/student' || item.to === '/instructor' || item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase">
            {user?.username?.charAt(0)}
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{user?.username}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-red-500 hover:text-red-600 font-medium"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}