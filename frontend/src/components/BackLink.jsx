import { Link, useNavigate } from 'react-router-dom';

export default function BackLink({ to, label = 'Back' }) {
  const navigate = useNavigate();

  const content = (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-3.5 py-2 rounded-xl hover:border-brand-500 hover:text-brand-600 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </span>
  );

  if (to) {
    return <Link to={to} className="inline-block mb-6">{content}</Link>;
  }

  return (
    <button onClick={() => navigate(-1)} className="mb-6">
      {content}
    </button>
  );
}