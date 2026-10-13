import { useState } from 'react';
import { submitStudentVerification } from '../api/subscriptionApi';

export default function StudentVerificationModal({ isOpen, onClose, onVerified }) {
  const [institutionName, setInstitutionName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionName || !studentIdNumber) {
      setError('Please provide your university/college name and Student ID number.');
      return;
    }
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await submitStudentVerification({
        institution_name: institutionName,
        student_id_number: studentIdNumber,
        student_email: studentEmail,
        document_name: 'Student_ID_Card_Verified.pdf',
      });
      setMessage(res.data.detail || 'Student ID verified! 50% student discount unlocked.');
      setTimeout(() => {
        if (onVerified) onVerified(res.data.verification);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-100 dark:border-brand-800 flex items-center justify-center text-2xl">
            🎓
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Student Discount Tier</h3>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">50% Off Any Subscription Plan</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
          Verify your student status with your academic credentials. Verified students unlock 50% off all all-access learning tiers!
        </p>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
              University / College / School Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Stanford University or IIT Bombay"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
              Student ID / Roll Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. STU-2024-9841"
              value={studentIdNumber}
              onChange={(e) => setStudentIdNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
              Student / Institutional Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. yourname@student.edu"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-medium"
            />
          </div>

          <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-800/40 flex items-center gap-2.5">
            <span className="text-base">⚡</span>
            <p className="text-[11px] text-brand-900 dark:text-brand-200 font-medium">
              Instant verification: Discount activates immediately upon submission for testing!
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Verifying...' : 'Verify & Unlock 50% Off ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
