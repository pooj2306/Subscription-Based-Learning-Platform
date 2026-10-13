import { Link } from 'react-router-dom';

export default function DemoAuthModal({ isOpen, onClose, featureName = 'this feature' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg p-1 rounded-lg cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-2xl mx-auto mb-4 shadow-xs">
          🔒
        </div>

        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full mb-2 border border-indigo-100 dark:border-indigo-800">
          Authentication Required
        </span>

        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          Unlock Full Access
        </h3>

        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
          You are currently previewing in <strong className="text-gray-700 dark:text-slate-200">Demo Mode</strong>. To access {featureName}, track verified completion certificates, and save your quiz history, sign in or create your free account.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition text-center"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition text-center"
          >
            Register for Free
          </Link>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-4">
          Free registration takes under 30 seconds • No credit card required
        </p>
      </div>
    </div>
  );
}
