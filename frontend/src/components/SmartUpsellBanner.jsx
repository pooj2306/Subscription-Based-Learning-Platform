import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSmartUpsell, purchaseCourse, startFreeTrial } from '../api/subscriptionApi';
import StudentVerificationModal from './StudentVerificationModal';

export default function SmartUpsellBanner({ onActionSuccess }) {
  const navigate = useNavigate();
  const [upsell, setUpsell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const fetchUpsell = () => {
    getSmartUpsell()
      .then((res) => setUpsell(res.data))
      .catch((err) => console.error('Failed to load smart upsell:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUpsell();
  }, []);

  if (loading) {
    return <div className="h-28 bg-gray-100/60 animate-pulse rounded-3xl mb-6" />;
  }

  if (!upsell || !upsell.recommended_course) return null;

  // If user subscription is paused, prompt to resume
  if (upsell.is_subscription_paused) {
    return (
      <div className="bg-amber-500/15 border border-amber-400/80 dark:border-amber-700/60 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 flex items-center justify-center text-lg shrink-0 font-bold border border-amber-200 dark:border-amber-800">
            ⏸️
          </div>
          <div>
            <p className="font-extrabold text-sm text-gray-900 dark:text-white">
              Targeted Recommendation: {upsell.recommended_course.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-300">
              Subscription is currently paused. Resume your membership to access this course and conquer your weak topics.
            </p>
          </div>
        </div>
        <Link
          to="/student/plans"
          className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
        >
          Resume Subscription ➔
        </Link>
      </div>
    );
  }

  // If user already owns or has access to this course, don't show aggressive upsell
  if (upsell.has_access) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/30 border border-emerald-300/80 dark:border-emerald-800/80 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-lg shrink-0">
            🎯
          </div>
          <div>
            <p className="font-extrabold text-sm text-gray-900 dark:text-white">
              Personalized Recommendation Active: {upsell.recommended_course.title}
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              You already have full access to this course! Continue lectures to conquer your weak topics.
            </p>
          </div>
        </div>
        <Link
          to={`/student/courses/${upsell.recommended_course.id}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
        >
          Continue Course ➔
        </Link>
      </div>
    );
  }

  const handlePurchaseCourse = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await purchaseCourse(upsell.recommended_course.id);
      setSuccessMessage(res.data.detail || 'Course purchased successfully!');
      fetchUpsell();
      if (onActionSuccess) onActionSuccess();
      setTimeout(() => {
        navigate(`/student/courses/${upsell.recommended_course.id}`);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to complete course purchase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await startFreeTrial();
      setSuccessMessage(res.data.detail || '7-Day Free Trial activated with Progress Carryover Guarantee!');
      fetchUpsell();
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not start free trial.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950 text-white border border-gray-800 shadow-xl mb-8 p-6 md:p-7">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Pill */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-300 uppercase tracking-wider">
          <span>🧠</span> {upsell.is_personalized ? 'Smart Upsell • Weak Topic Recommendation' : 'Featured Track'}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
          <span>🛡️</span> Progress Carryover Guarantee Active
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8">
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
            {upsell.headline}
          </h3>

          {/* Weak Topics Chips */}
          {upsell.weak_topics && upsell.weak_topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-slate-300 font-semibold">Identified Weak Areas:</span>
              {upsell.weak_topics.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black"
                >
                  <span>⚠️</span> {t.topic_name} ({t.accuracy}% accuracy)
                </span>
              ))}
            </div>
          )}

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-4 max-w-2xl">
            {upsell.reason}
          </p>

          {/* Guarantee Note */}
          <p className="text-[11px] text-indigo-200/90 flex items-center gap-1.5 mb-2 font-medium">
            <span>✨</span> Flexible Options: Pay once for this single course, or activate a 7-day trial with full progress carryover if you pause or cancel later.
          </p>
        </div>

        {/* Action Panel / Pricing Box */}
        <div className="lg:col-span-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex flex-col justify-between">
          <div className="mb-4">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">Recommended Course</span>
            <p className="font-extrabold text-white text-base leading-snug">{upsell.recommended_course.title}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
              <span className="px-2 py-0.5 rounded bg-white/10">{upsell.recommended_course.level}</span>
              <span>{upsell.recommended_course.stream}</span>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="mb-3 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-3 py-2 rounded-xl text-xs font-bold">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-3 bg-rose-500/20 border border-rose-400/40 text-rose-200 px-3 py-2 rounded-xl text-xs font-bold">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Pay-Per-Course Option */}
            <button
              onClick={handlePurchaseCourse}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              <span>💳 Pay-Per-Course (Lifetime)</span>
              <span className="text-xs font-extrabold bg-black/15 px-2 py-0.5 rounded">
                ₹{upsell.pricing?.pay_per_course_price || 499}
              </span>
            </button>

            {/* Free Trial Option if eligible */}
            {upsell.trial_eligible && (
              <button
                onClick={handleStartTrial}
                disabled={actionLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>🎁 Start 7-Day Free Trial</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase font-black">₹0 Free</span>
              </button>
            )}

            {/* Student Discount or All Plans */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                onClick={() => setIsVerifyModalOpen(true)}
                className="text-indigo-200 hover:text-white font-bold text-[11px] underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>🎓</span> Student 50% Off
              </button>
              <Link
                to="/student/plans"
                className="text-white hover:text-indigo-200 font-bold text-[11px] flex items-center gap-1"
              >
                All Plans ➔
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Student Verification Modal */}
      <StudentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerified={() => {
          fetchUpsell();
          setSuccessMessage('Student status verified! 50% discount unlocked.');
        }}
      />
    </div>
  );
}
