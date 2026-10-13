import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseDetail } from '../../api/courseApi';
import { getCourseQuizzes } from '../../api/quizApi';
import { requestCertificate } from '../../api/certificateApi';
import { getCourseProgressDetail } from '../../api/progressApi';
import { purchaseCourse } from '../../api/subscriptionApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
import PomodoroTimer from '../../components/PomodoroTimer';
import ProjectCertificateModal from '../../components/ProjectCertificateModal';
import DemoAuthModal from '../../components/DemoAuthModal';

export default function CourseDetail({ isDemo = false }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certMessage, setCertMessage] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalFeature, setAuthModalFeature] = useState('');

  const promptAuth = (feature) => {
    setAuthModalFeature(feature);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    getCourseDetail(courseId)
      .then((res) => setCourse(res.data))
      .catch(() => setError('Failed to load course.'))
      .finally(() => setLoading(false));

    if (!isDemo) {
      getCourseQuizzes(courseId).then((res) => setQuizzes(res.data)).catch(() => setQuizzes([]));
      getCourseProgressDetail(courseId).then((res) => setProgress(res.data)).catch(() => setProgress(null));
    }
  }, [courseId, isDemo]);

  const handleRequestCertificate = async () => {
    if (isDemo) {
      promptAuth('requesting completion certificates');
      return;
    }
    setCertMessage('');
    try {
      await requestCertificate(courseId);
      setCertMessage('Certificate generated! Check "Certificates" in the sidebar.');
    } catch (err) {
      setCertMessage(err.response?.data?.detail || 'Could not generate certificate.');
    }
  };

  const handlePurchaseCourse = async () => {
    if (isDemo) {
      promptAuth('purchasing courses and lifetime enrollment');
      return;
    }
    setPurchasing(true);
    setPurchaseMessage('');
    try {
      const res = await purchaseCourse(courseId);
      setPurchaseMessage(res.data.detail || 'Course purchased successfully! Lifetime access unlocked.');
      const courseRes = await getCourseDetail(courseId);
      setCourse(courseRes.data);
    } catch (err) {
      setPurchaseMessage(err.response?.data?.detail || 'Failed to complete course purchase.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <DashboardLayout isDemo={isDemo}><p className="text-gray-400">Loading course...</p></DashboardLayout>;
  if (error) return <DashboardLayout isDemo={isDemo}><p className="text-red-500">{error}</p></DashboardLayout>;

  return (
    <DashboardLayout isDemo={isDemo}>
      <BackLink to={isDemo ? '/demo' : '/student'} label={isDemo ? 'Back to Demo Catalogue' : 'Back to Dashboard'} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">{course.level}</span>
        <span className="text-xs text-gray-400 dark:text-slate-400">{course.stream}</span>
        {course.is_premium && (
          <span className="text-xs font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">★ Premium Track</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{course.title}</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">by {course.instructor_name}</p>
      <p className="text-gray-700 dark:text-slate-300 mb-6 max-w-2xl">{course.description}</p>

      {/* ── Paused Subscription Alert ── */}
      {course.is_subscription_paused && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-brand-700/10 border border-amber-400/80 dark:border-amber-700/60 rounded-2xl p-5 mb-8 max-w-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">⏸️</span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">Subscription Paused: Course Access Stopped</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">
                {course.is_purchased
                  ? 'Access to this owned course is stopped while your subscription is paused. Resume your subscription anytime to immediately restore access.'
                  : 'Access to course lectures and quizzes is stopped while your subscription is paused. Resume your subscription anytime to continue learning.'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                <span>🛡️</span> 100% Progress Preserved: All notes, quiz attempts, and elo ratings remain saved.
              </div>
            </div>
            <Link
              to="/student/plans"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl text-center transition shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>▶️</span> Resume Subscription
            </Link>
          </div>
        </div>
      )}

      {/* ── Pay-per-course / Subscription Access Notice (When not paused and no access) ── */}
      {course.requires_subscription && !course.has_access && !course.is_subscription_paused && (
        <div className="bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-brand-700/10 border border-amber-300/80 dark:border-amber-900/60 rounded-2xl p-5 mb-8 max-w-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🔒</span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">Unlock Full Access to this Course</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                Choose between permanent one-time course ownership or unlimited all-access membership.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-100/70 dark:bg-brand-950/70 text-brand-800 dark:text-indigo-300 text-[10px] font-bold">
                <span>🛡️</span> 100% Progress Carryover: Notes and quizzes are never lost.
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handlePurchaseCourse}
                disabled={purchasing}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
              >
                {purchasing ? 'Purchasing...' : `Buy Course (₹${course.price || 499}) ➔`}
              </button>
              {isDemo ? (
                <button
                  onClick={() => promptAuth('All-Access membership plans')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl text-center transition cursor-pointer"
                >
                  All-Access Plan (Free Trial)
                </button>
              ) : (
                <Link
                  to="/student/plans"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl text-center transition"
                >
                  All-Access Plan (Free Trial)
                </Link>
              )}
            </div>
          </div>
          {purchaseMessage && (
            <p className="text-xs font-bold text-brand-700 dark:text-indigo-300 mt-3 pt-2 border-t border-amber-200 dark:border-amber-900">
              {purchaseMessage}
            </p>
          )}
        </div>
      )}

      {course.is_purchased && (
        <div className={`border px-4 py-2.5 rounded-xl text-xs font-bold mb-6 max-w-2xl flex items-center justify-between gap-2 ${
          course.is_subscription_paused || !course.has_access
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-900 dark:text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            <span>{course.is_subscription_paused || !course.has_access ? '⏸️' : '✓'}</span>
            <span>
              {course.is_subscription_paused || !course.has_access
                ? 'You own this course, but access is currently stopped because your subscription is paused.'
                : 'You own permanent lifetime access to this course (Pay-Per-Course Enrolled).'}
            </span>
          </div>
          {(course.is_subscription_paused || !course.has_access) && (
            <Link to="/student/plans" className="underline font-bold text-brand-600 dark:text-indigo-300 shrink-0">
              Resume ➔
            </Link>
          )}
        </div>
      )}

      {progress && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 mb-8 max-w-2xl transition-colors">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {progress.completed_lessons}/{progress.total_lessons} lessons complete
            </p>
            <p className="text-sm font-bold text-brand-600 dark:text-indigo-400">{progress.progress_percent}%</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress.progress_percent}%` }}
            />
          </div>
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>🛡️</span> Project-Based Certification
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Requires 100% lectures + Passed exam + Verified capstone mini-project</p>
            </div>
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              Check & Claim Certificate ➔
            </button>
          </div>
          {certMessage && <p className="text-sm mt-3 text-brand-600 dark:text-indigo-400 font-medium">{certMessage}</p>}
        </div>
      )}

      {/* Focus Mode & Pomodoro Study Dock */}
      <div className="mb-8 max-w-3xl">
        <PomodoroTimer courseId={courseId} />
      </div>

      <div className="flex items-center justify-between mb-4 max-w-3xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Curriculum Modules</h3>
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-transparent dark:border-slate-700">
          {course.lessons?.length || 0} Lessons Total
        </span>
      </div>

      <div className="space-y-5 mb-10 max-w-3xl">
        {Object.entries(
          (course.lessons || []).reduce((acc, lesson) => {
            const modName = lesson.module_name || 'General Curriculum';
            if (!acc[modName]) acc[modName] = [];
            acc[modName].push(lesson);
            return acc;
          }, {})
        ).map(([moduleName, moduleLessons], modIdx) => (
          <div key={moduleName} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {modIdx + 1}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{moduleName}</h4>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-2.5 py-1 rounded-full">
                {moduleLessons.length} {moduleLessons.length === 1 ? 'topic' : 'topics'}
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {moduleLessons.map((lesson) => {
                const isLocked = course.requires_subscription && !course.has_access;
                return (
                  <Link
                    key={lesson.id}
                    to={isLocked ? '/student/plans' : `/student/courses/${courseId}/lessons/${lesson.id}`}
                    title={isLocked ? (course.is_subscription_paused ? 'Subscription paused - Click to resume' : 'Subscription required') : ''}
                    className="flex items-center justify-between p-3.5 px-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold transition ${
                        isLocked
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-brand-600 group-hover:text-white'
                      }`}>
                        {isLocked ? (course.is_subscription_paused ? '⏸️' : '🔒') : '•'}
                      </span>
                      <span className={`text-sm font-medium transition ${
                        isLocked ? 'text-gray-500 dark:text-slate-400' : 'text-gray-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-white'
                      }`}>
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {course.is_subscription_paused ? 'Access Paused' : 'Locked'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium group-hover:text-gray-600 dark:group-hover:text-slate-300 transition">
                        {lesson.duration_minutes} min →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {quizzes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quizzes & Adaptive Testing</h3>
            <Link
              to="/student/topic-strengths"
              className="text-xs font-bold text-brand-700 dark:text-indigo-300 bg-brand-50 dark:bg-brand-900/40 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition"
            >
              🎯 Practice Weak Topics
            </Link>
          </div>
          <div className="space-y-3 max-w-2xl">
            {quizzes.map((quiz) => {
              const isLocked = course.requires_subscription && !course.has_access;
              return (
                <div
                  key={quiz.id}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">📝 {quiz.title}</span>
                  <div className="flex gap-2">
                    {isLocked ? (
                      <Link
                        to="/student/plans"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition flex items-center gap-1"
                      >
                        <span>{course.is_subscription_paused ? '⏸️ Paused' : '🔒 Locked'}</span>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={`/student/quizzes/${quiz.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 transition"
                        >
                          Standard
                        </Link>
                        <Link
                          to={`/student/adaptive-quiz/${quiz.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
                        >
                          🧠 Adaptive
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Project-Based Certificate Modal */}
      <ProjectCertificateModal
        courseId={courseId}
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      {/* Demo Mode Authentication Prompt Modal */}
      <DemoAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        featureName={authModalFeature}
      />
    </DashboardLayout>
  );
}