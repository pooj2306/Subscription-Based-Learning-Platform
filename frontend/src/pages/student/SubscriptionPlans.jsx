import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getPlans,
  getMySubscriptions,
  subscribeToPlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  startFreeTrial,
  getProgressCarryover,
  purchaseCourse,
  getPurchasedCourses,
  getStudentVerification,
} from '../../api/subscriptionApi';
import { getCourses } from '../../api/courseApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
import StudentVerificationModal from '../../components/StudentVerificationModal';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [progressCarryover, setProgressCarryover] = useState(null);
  const [verification, setVerification] = useState(null);

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'my-purchases' | 'pay-per-course'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const [
        plansRes,
        subsRes,
        purchasedRes,
        coursesRes,
        carryoverRes,
        verifyRes,
      ] = await Promise.all([
        getPlans(),
        getMySubscriptions().catch(() => ({ data: [] })),
        getPurchasedCourses().catch(() => ({ data: [] })),
        getCourses().catch(() => ({ data: [] })),
        getProgressCarryover().catch(() => ({ data: null })),
        getStudentVerification().catch(() => ({ data: null })),
      ]);

      setPlans(plansRes.data || []);
      setMySubscriptions(subsRes.data || []);
      setPurchasedCourses(purchasedRes.data || []);
      setAllCourses(coursesRes.data || []);
      if (carryoverRes?.data) setProgressCarryover(carryoverRes.data);
      if (verifyRes?.data) setVerification(verifyRes.data);
    } catch (err) {
      console.error('Failed to load subscription hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const activeSub = mySubscriptions.find((s) => s.status === 'ACTIVE' && s.is_active);
  const pausedSub = mySubscriptions.find((s) => s.status === 'PAUSED');

  const handleSubscribe = async (planId) => {
    setActionLoading(`sub-${planId}`);
    setMessage('');
    setErrorMessage('');
    try {
      await subscribeToPlan(planId);
      setMessage('Subscription activated successfully! Welcome aboard.');
      await loadAllData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Subscription failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (subId) => {
    setActionLoading(`pause-${subId}`);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await pauseSubscription(subId);
      setMessage(res.data.detail || 'Subscription paused. Your remaining days are preserved.');
      await loadAllData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not pause subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (subId) => {
    setActionLoading(`resume-${subId}`);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await resumeSubscription(subId);
      setMessage(res.data.detail || 'Subscription resumed! Welcome back.');
      await loadAllData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not resume subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (subId) => {
    if (!window.confirm('Are you sure you want to cancel? Your progress will remain 100% saved under our Progress Carryover Guarantee.')) {
      return;
    }
    setActionLoading(`cancel-${subId}`);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await cancelSubscription(subId);
      setMessage(res.data.detail || 'Subscription cancelled. Progress safely saved.');
      await loadAllData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not cancel subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartTrial = async () => {
    setActionLoading('trial');
    setMessage('');
    setErrorMessage('');
    try {
      const res = await startFreeTrial();
      setMessage(res.data.detail || '7-Day Free Trial activated! Full access granted.');
      await loadAllData();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not activate trial.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuyCourse = async (courseId) => {
    setActionLoading(`course-${courseId}`);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await purchaseCourse(courseId);
      setMessage(res.data.detail || 'Course purchased successfully! Added to your Bought Courses tab.');
      await loadAllData();
      setActiveTab('my-purchases'); // Switch to My Bought Courses tab to show the bought course
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Purchase failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading plans and membership...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isVerifiedStudent = verification?.is_verified;

  return (
    <DashboardLayout>
      <BackLink to="/student" label="Back to Dashboard" />

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Subscription & Learning Passes Hub
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Manage your all-access subscriptions, view your purchased courses, or browse standalone pay-per-course options.
          </p>
        </div>

        {/* Tab switch with Bought Courses count badge */}
        <div className="flex flex-wrap items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0 self-start border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-brand-600 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white'
            }`}
          >
            💳 All-Access Plans
          </button>
          <button
            onClick={() => setActiveTab('my-purchases')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-purchases'
                ? 'bg-brand-600 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white'
            }`}
          >
            <span>📚</span>
            <span>My Bought Courses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                purchasedCourses.length > 0
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-brand-700 dark:text-indigo-200'
                  : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
              }`}
            >
              {purchasedCourses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pay-per-course')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'pay-per-course'
                ? 'bg-brand-600 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white'
            }`}
          >
            🎯 Pay-Per-Course Catalog
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span> {message}
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 dark:text-emerald-300 hover:opacity-80">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span> {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900">✕</button>
        </div>
      )}

      {/* ── Active or Paused Subscription Control Dock ── */}
      {(activeSub || pausedSub) && (
        <div className="mb-8 rounded-3xl p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                {activeSub ? '⚡' : '⏸️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-wider text-indigo-300">Current Membership</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      activeSub ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {activeSub ? 'Active Subscription' : 'Subscription Paused'}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white mt-0.5">
                  {(activeSub || pausedSub).plan_name}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {activeSub ? (
                    <>Expires on: {new Date(activeSub.end_date).toLocaleDateString()} • Full course & certificate access</>
                  ) : (
                    <>Paused on {new Date(pausedSub.paused_at).toLocaleDateString()} • {pausedSub.remaining_days_at_pause} days preserved • Course access stopped until resumed</>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons for Active/Paused Sub */}
            <div className="flex flex-wrap items-center gap-2.5">
              {activeSub && (
                <>
                  <button
                    onClick={() => handlePause(activeSub.id)}
                    disabled={actionLoading === `pause-${activeSub.id}`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>⏸️</span> {actionLoading === `pause-${activeSub.id}` ? 'Pausing...' : 'Pause Subscription'}
                  </button>
                  <button
                    onClick={() => handleCancel(activeSub.id)}
                    disabled={actionLoading === `cancel-${activeSub.id}`}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 border border-slate-700"
                  >
                    {actionLoading === `cancel-${activeSub.id}` ? 'Cancelling...' : 'Cancel'}
                  </button>
                </>
              )}

              {pausedSub && (
                <button
                  onClick={() => handleResume(pausedSub.id)}
                  disabled={actionLoading === `resume-${pausedSub.id}`}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>▶️</span> {actionLoading === `resume-${pausedSub.id}` ? 'Resuming...' : 'Resume Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Summary of Bought Courses (Quick Access Banner) ── */}
      {purchasedCourses.length > 0 && activeTab !== 'my-purchases' && (
        <div className="mb-8 rounded-3xl p-5 bg-indigo-50/70 dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-brand-700 dark:text-indigo-300 flex items-center justify-center text-xl shrink-0 font-bold border border-indigo-200 dark:border-indigo-800">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  You own {purchasedCourses.length} standalone {purchasedCourses.length === 1 ? 'course' : 'courses'} (Lifetime Access)
                </h4>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  pausedSub
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'bg-indigo-200 dark:bg-indigo-900 text-brand-900 dark:text-indigo-200'
                }`}>
                  {pausedSub ? 'Owned (Access Paused)' : 'Owned'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                {purchasedCourses.map((p) => p.course_title).slice(0, 2).join(', ')}
                {purchasedCourses.length > 2 ? ` and ${purchasedCourses.length - 2} more` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('my-purchases')}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition shrink-0 cursor-pointer"
          >
            View Bought Courses ({purchasedCourses.length}) ➔
          </button>
        </div>
      )}

      {/* ── Progress Carryover Guarantee Pill ── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-brand-600 dark:text-indigo-300 flex items-center justify-center text-xl shrink-0 border border-indigo-200 dark:border-indigo-800">
            🛡️
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
              100% Progress Carryover Guarantee
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-300">
              Never lose your hard work. When you pause, cancel, or test on a Free Trial, all lecture bookmarks, quiz attempts, and topic Elo ratings remain permanently saved in your profile.
            </p>
          </div>
        </div>

        {progressCarryover && (
          <div className="flex items-center gap-3 shrink-0 text-center">
            <div className="bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--card-border)] shadow-2xs">
              <span className="text-xs font-black text-brand-600 dark:text-indigo-400 block">{progressCarryover.stats.lessons_completed}</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold">Lessons Saved</span>
            </div>
            <div className="bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--card-border)] shadow-2xs">
              <span className="text-xs font-black text-brand-600 dark:text-indigo-400 block">{progressCarryover.stats.quizzes_taken}</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold">Quizzes Preserved</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Student Discount Tier Verification Banner ── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-brand-600 dark:text-indigo-300 flex items-center justify-center text-xl shrink-0 border border-indigo-200 dark:border-indigo-800">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                Student Discount Tier (50% Off All Plans)
              </h4>
              {isVerifiedStudent ? (
                <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Verified ✓
                </span>
              ) : (
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Unverified
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-300 mt-0.5">
              {isVerifiedStudent
                ? `Verified with ${verification?.verification?.institution_name || 'Academic Institution'}. 50% discount automatically applied to all plans below!`
                : 'Are you enrolled in high school, college, or bootcamp? Verify your student credentials in 30 seconds to slash prices in half.'}
            </p>
          </div>
        </div>

        {!isVerifiedStudent && (
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition shrink-0 cursor-pointer"
          >
            Verify Student ID ➔
          </button>
        )}
      </div>

      {/* ── TAB 1: ALL-ACCESS SUBSCRIPTION PLANS ── */}
      {activeTab === 'plans' && (
        <div>
          {/* Free Trial Banner if eligible */}
          {progressCarryover?.trial_eligible && (
            <div className="mb-8 p-5 bg-gradient-to-r from-brand-600 to-brand-800 rounded-3xl text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-500/30">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  🎁
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Want to try before subscribing?</h4>
                  <p className="text-xs text-indigo-100">
                    Activate a 7-day Free Trial with ₹0 upfront payment. Keep 100% of your lesson progress if you decide to pause or subscribe later.
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartTrial}
                disabled={actionLoading === 'trial'}
                className="px-5 py-2.5 bg-white text-brand-950 hover:bg-slate-100 rounded-xl text-xs font-black shadow-sm transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === 'trial' ? 'Activating Trial...' : 'Start 7-Day Free Trial (₹0) ➔'}
              </button>
            </div>
          )}

          {/* Grid of Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {plans
              .filter((p) => p.plan_type !== 'TRIAL')
              .map((plan, i) => {
                const isPopular = i === 1 || plan.name.toLowerCase().includes('pro');
                const isStudentTier = plan.plan_type === 'STUDENT';
                const effectivePrice = plan.effective_price ?? plan.price;

                return (
                  <div
                    key={plan.id}
                    className={`card-hover rounded-3xl p-6 flex flex-col border transition relative ${
                      isPopular
                        ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-700/80 shadow-xl'
                        : isStudentTier
                        ? 'bg-indigo-50/50 dark:bg-slate-900 border-indigo-200 dark:border-slate-800 shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--card-border)] shadow-sm'
                    }`}
                  >
                    {isPopular && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full w-fit mb-3 border border-white/20">
                        Most Popular • Pro Choice
                      </span>
                    )}

                    {isStudentTier && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white px-2.5 py-1 rounded-full w-fit mb-3">
                        Student Discount Pass
                      </span>
                    )}

                    <h3
                      className={`text-lg font-black mb-1 ${
                        isPopular ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs mb-5 ${
                        isPopular ? 'text-slate-300' : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.description || 'Full all-access pass to every course and certification.'}
                    </p>

                    {/* Price Block */}
                    <div className="mb-4">
                      {isVerifiedStudent && effectivePrice < plan.price ? (
                        <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-black ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>₹{effectivePrice}</span>
                          <span className={`text-sm line-through ${isPopular ? 'text-slate-400' : 'text-gray-400'}`}>
                            ₹{plan.price}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-brand-600 text-white rounded-md">
                            50% OFF
                          </span>
                        </div>
                      ) : (
                        <p className={`text-3xl font-black ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>₹{plan.price}</p>
                      )}
                      <p
                        className={`text-xs mt-1 font-bold ${
                          isPopular ? 'text-slate-400' : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        Duration: {plan.duration_days} days
                      </p>
                    </div>

                    {/* Feature list */}
                    <ul className={`space-y-2 mb-6 text-xs ${isPopular ? 'text-slate-200' : 'text-gray-600 dark:text-slate-300'}`}>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-indigo-400 font-black">✓</span> Unlimited access to all video lectures
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-indigo-400 font-black">✓</span> Adaptive AI quizzes & weak-topic drills
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-indigo-400 font-black">✓</span> Spaced repetition flashcard engine
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-indigo-400 font-black">✓</span> Verified capstone project certificates
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-indigo-400 font-black">✓</span> Pause anytime with preserved duration
                      </li>
                    </ul>

                    {/* Action button */}
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={actionLoading === `sub-${plan.id}`}
                      className={`mt-auto py-3 rounded-2xl font-black text-xs transition cursor-pointer disabled:opacity-50 ${
                        isPopular
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-sm'
                          : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                      }`}
                    >
                      {actionLoading === `sub-${plan.id}` ? 'Processing...' : 'Subscribe Now ➔'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── TAB 2: MY BOUGHT COURSES ── */}
      {activeTab === 'my-purchases' && (
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>📚</span> My Purchased Courses ({purchasedCourses.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Courses you bought individually via Pay-Per-Course. You have permanent lifetime access to all lectures, quizzes, and certificates.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pay-per-course')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition self-start sm:self-auto cursor-pointer"
            >
              + Buy More Courses
            </button>
          </div>

          {purchasedCourses.length === 0 ? (
            <div className="bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--card-border)] p-12 text-center max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-brand-600 dark:text-indigo-300 flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-200 dark:border-indigo-800">
                📚
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white mb-1">
                No Standalone Courses Bought Yet
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                When you buy individual courses using Pay-Per-Course, they will show up right here with permanent lifetime access, no recurring renewal required!
              </p>
              <button
                onClick={() => setActiveTab('pay-per-course')}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Browse Pay-Per-Course Catalog ➔
              </button>
            </div>
          ) : (
            <div>
              {pausedSub && (
                <div className="bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏸️</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                        Subscription Paused: Course Access Stopped
                      </h4>
                      <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                        Access to your owned courses is currently stopped while your subscription is paused. Resume your subscription anytime to immediately restore full access.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResume(pausedSub.id)}
                    disabled={actionLoading === `resume-${pausedSub.id}`}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>▶️</span> {actionLoading === `resume-${pausedSub.id}` ? 'Resuming...' : 'Resume Subscription'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedCourses.map((item) => {
                  const isItemPaused = Boolean(pausedSub) || item.has_access === false || item.is_subscription_paused;
                  return (
                    <div
                      key={item.id}
                      className="bg-[var(--bg-card)] rounded-3xl border border-[var(--card-border)] shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isItemPaused
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {isItemPaused ? '⏸️ Access Paused' : '✓ Lifetime Owned'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                            {item.purchased_at ? new Date(item.purchased_at).toLocaleDateString() : 'Active'}
                          </span>
                        </div>

                        <h4 className="font-black text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
                          {item.course_title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-4 mt-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[11px] text-gray-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.level || 'Course'}
                          </span>
                          <span className="text-gray-400 dark:text-slate-500 font-medium text-[11px]">
                            {item.stream || 'Technology'}
                          </span>
                          {item.lessons_count > 0 && (
                            <span className="text-gray-400 dark:text-slate-500 font-medium text-[11px]">
                              • {item.lessons_count} lessons
                            </span>
                          )}
                        </div>

                        {item.instructor_name && (
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-4">
                            Instructor: <span className="font-semibold text-gray-600 dark:text-slate-300">{item.instructor_name}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold block">Paid Once</span>
                          <p className="text-base font-black text-brand-600 dark:text-brand-400">₹{item.amount_paid}</p>
                        </div>

                        {isItemPaused ? (
                          <button
                            onClick={() => handleResume(pausedSub?.id)}
                            disabled={actionLoading === `resume-${pausedSub?.id}`}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span>▶️ Resume to Open</span>
                          </button>
                        ) : (
                          <Link
                            to={`/student/courses/${item.course}`}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5"
                          >
                            <span>Open Course</span>
                            <span>➔</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PAY-PER-COURSE DIRECT ACCESS CATALOG ── */}
      {activeTab === 'pay-per-course' && (
        <div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
            <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>💳</span> Pay-Per-Course Catalog: No Monthly Commitment
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-300 mt-1">
              Prefer to buy just what you need? Purchase individual courses once and enjoy unlimited lifetime access to all lectures, notes, quizzes, and project capstones forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {allCourses.map((course) => {
              const isPurchased = purchasedCourses.some((p) => p.course === course.id) || course.is_purchased;
              const hasAccess = activeSub || isPurchased || course.has_access;

              return (
                <div
                  key={course.id}
                  className="bg-[var(--bg-card)] rounded-3xl border border-[var(--card-border)] p-5 shadow-xs flex flex-col justify-between card-hover"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-brand-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {course.level}
                      </span>
                      {course.is_premium && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-600 text-white">
                          ★ Premium Track
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-gray-900 dark:text-white text-base mb-1 line-clamp-1">{course.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-4">{course.stream}</p>
                  </div>

                  <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold block">One-Time Fee</span>
                      <p className="text-lg font-black text-gray-900 dark:text-white">₹{course.price || 499}</p>
                    </div>

                    {isPurchased ? (
                      pausedSub ? (
                        <button
                          onClick={() => handleResume(pausedSub.id)}
                          className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-black rounded-xl transition flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer"
                          title="Subscription paused - click to resume and restore course access"
                        >
                          <span>⏸️ Owned (Paused)</span>
                        </button>
                      ) : (
                        <Link
                          to={`/student/courses/${course.id}`}
                          className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-xl transition flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                        >
                          <span>✓ Owned</span>
                          <span>➔</span>
                        </Link>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuyCourse(course.id)}
                        disabled={actionLoading === `course-${course.id}`}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `course-${course.id}` ? 'Processing...' : 'Buy Course ➔'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Student Verification Modal */}
      <StudentVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onVerified={() => {
          loadAllData();
          setMessage('Student verification approved! 50% discount unlocked on all plans.');
        }}
      />
    </DashboardLayout>
  );
}