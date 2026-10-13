import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../../api/courseApi';
import { getMySubscriptions } from '../../api/subscriptionApi';
import { getTopicStrengths, getDueCards } from '../../api/adaptiveApi';
import { getMyGamificationProfile, getStudyGroups, getRoadmaps } from '../../api/engagementApi';
import { getStudentAnalytics } from '../../api/dashboardApi';
import DashboardLayout from '../../components/DashboardLayout';
import GamificationHeader from '../../components/GamificationHeader';
import SmartUpsellBanner from '../../components/SmartUpsellBanner';
import IndustryTrendsSection from '../../components/IndustryTrendsSection';
import DemoAuthModal from '../../components/DemoAuthModal';

export default function StudentDashboard({ isDemo = false }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [hasPausedSubscription, setHasPausedSubscription] = useState(false);
  const [adaptiveInsight, setAdaptiveInsight] = useState(null);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [gamification, setGamification] = useState(null);
  const [studyGroups, setStudyGroups] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalFeature, setAuthModalFeature] = useState('');

  const promptAuth = (feature) => {
    setAuthModalFeature(feature);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    if (isDemo) {
      // In genuine demo mode, only fetch public courses and mock empty state for private endpoints
      getCourses()
        .then((res) => {
          setCourses(res.data || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([
      getCourses(),
      getMySubscriptions().catch(() => ({ data: [] })),
      getTopicStrengths().catch(() => ({ data: null })),
      getDueCards().catch(() => ({ data: { due_count: 0 } })),
      getMyGamificationProfile().catch(() => ({ data: null })),
      getStudyGroups().catch(() => ({ data: [] })),
      getRoadmaps().catch(() => ({ data: [] })),
      getStudentAnalytics().catch(() => ({ data: null })),
    ])
      .then(([coursesRes, subsRes, strengthsRes, dueRes, gamRes, groupsRes, roadmapsRes, analyticsRes]) => {
        setCourses(coursesRes.data || []);
        const subs = subsRes.data || [];
        const isActive = subs.some((sub) => sub.status === 'ACTIVE' || sub.is_active);
        const isPaused = subs.some((sub) => sub.status === 'PAUSED') && !isActive;
        setHasActiveSubscription(isActive);
        setHasPausedSubscription(isPaused);
        if (strengthsRes?.data) setAdaptiveInsight(strengthsRes.data);
        if (dueRes?.data) setDueCardsCount(dueRes.data.due_count || 0);
        if (gamRes?.data) setGamification(gamRes.data);
        if (groupsRes?.data) setStudyGroups(groupsRes.data);
        if (roadmapsRes?.data) setRoadmaps(roadmapsRes.data);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isDemo]);

  if (loading) {
    return (
      <DashboardLayout isDemo={isDemo}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">
            {isDemo ? 'Loading interactive demo catalogue...' : 'Preparing your learning workspace...'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesStream = selectedStream === 'ALL' || c.stream?.toLowerCase() === selectedStream.toLowerCase() || c.level === selectedStream;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStream && matchesSearch;
  });

  const joinedGroup = studyGroups.find((g) => g.is_member) || studyGroups[0];

  return (
    <DashboardLayout isDemo={isDemo}>
      {/* ── Demo Mode Notification Banner ── */}
      {isDemo && (
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-4 sm:p-5 mb-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white/20 rounded-xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Demo Preview
                </span>
                <span className="text-xs text-indigo-200">No account required</span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base mt-1">
                Explore Courses & Platform Features
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Inspect real curriculum modules, lesson topics, and syllabus outlines. Create your free account anytime to take quizzes, track streaks, and earn certificates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs rounded-xl shadow-xs transition"
            >
              Register for Free
            </Link>
          </div>
        </div>
      )}

      {/* ── Gamification Top Bar (Streak, XP, Level) ── */}
      {!isDemo && <GamificationHeader />}

      {/* ── Paused Subscription Alert Banner ── */}
      {!isDemo && hasPausedSubscription && (
        <div className="bg-amber-500/15 border border-amber-400/80 dark:border-amber-700/60 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 flex items-center justify-center text-xl shrink-0 font-bold border border-amber-200 dark:border-amber-800">
              ⏸️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  Subscription Paused: Course Access Stopped
                </h4>
                <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Paused
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                Access to courses (including your owned courses) is temporarily stopped while your subscription is on hold. All completed lessons and quiz scores remain 100% saved.
              </p>
            </div>
          </div>
          <Link
            to="/student/plans"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center gap-1.5"
          >
            <span>▶️</span> Resume Subscription
          </Link>
        </div>
      )}

      {/* ── Smart Upsell: Weak-Topic Targeted Recommendation ── */}
      {!isDemo && <SmartUpsellBanner onActionSuccess={() => setHasActiveSubscription(true)} />}

      {/* ── Main Engagement Hero Banner ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3 border border-white/15">
              <span>🚀</span> Level {gamification?.level || 1} • {gamification?.level_title || (isDemo ? 'Explorer' : 'Learner')}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">
              Ready to accelerate your mastery today?
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
              Track actual study time with Focus Pomodoro, conquer career skill trees, and contribute XP to your collaborative study group.
            </p>

            <div className="flex flex-wrap gap-3">
              {isDemo ? (
                <>
                  <button
                    onClick={() => promptAuth('Skill Roadmaps')}
                    className="bg-white text-slate-900 hover:bg-slate-100 font-black px-5 py-2.5 rounded-xl text-xs md:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>🗺️</span> Skill Roadmaps
                  </button>
                  <button
                    onClick={() => promptAuth('Study Guilds')}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition flex items-center gap-2 border border-white/15 cursor-pointer"
                  >
                    <span>👥</span> Study Guilds
                  </button>
                  <button
                    onClick={() => promptAuth('Leaderboard Rankings')}
                    className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>🏆</span> Rankings
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/student/roadmaps"
                    className="bg-white text-slate-900 hover:bg-slate-100 font-black px-5 py-2.5 rounded-xl text-xs md:text-sm shadow-md transition flex items-center gap-2"
                  >
                    <span>🗺️</span> Skill Roadmaps
                  </Link>
                  <Link
                    to="/student/study-groups"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition flex items-center gap-2 border border-white/15"
                  >
                    <span>👥</span> Study Guilds
                  </Link>
                  <Link
                    to="/student/leaderboard"
                    className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition flex items-center gap-2 shadow-xs"
                  >
                    <span>🏆</span> Rankings
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 gap-3 lg:w-72 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">🔥</span>
              <p className="text-xl md:text-2xl font-black text-white">{gamification?.current_streak || 0}d</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Study Streak</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">⚡</span>
              <p className="text-xl md:text-2xl font-black text-amber-300">{(gamification?.xp || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Total XP</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">⏱️</span>
              <p className="text-xl md:text-2xl font-black text-emerald-300">{gamification?.total_focus_minutes || 0}m</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Focus Minutes</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl block mb-1">🏅</span>
              <p className="text-xl md:text-2xl font-black text-indigo-300">{gamification?.earned_badges?.length || 0}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Badges Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collaborative Study Group Shared Goal Card ── */}
      {joinedGroup && (
        <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-xs border border-[var(--card-border)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center text-3xl shrink-0">
              {joinedGroup.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-slate-800 text-brand-700 dark:text-indigo-300">
                  Shared Weekly Goal
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-400 font-semibold">• {joinedGroup.name}</span>
              </div>
              <h4 className="font-black text-base text-gray-900 dark:text-white">
                {joinedGroup.weekly_goal_title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {joinedGroup.current_weekly_xp.toLocaleString()} of {joinedGroup.target_weekly_xp.toLocaleString()} collective XP reached ({joinedGroup.goal_progress_percent}%)
              </p>
            </div>
          </div>

          <div className="md:w-64 flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 to-brand-700 h-full rounded-full transition-all duration-700"
                style={{ width: `${joinedGroup.goal_progress_percent}%` }}
              />
            </div>
            <Link
              to="/student/study-groups"
              className="text-xs font-bold text-brand-600 dark:text-indigo-400 hover:underline transition"
            >
              Open Guild Workspace ➔
            </Link>
          </div>
        </div>
      )}

      {/* ── 3-Pillar Analytics: Time Spent, Accuracy Trends & Predicted Exam Readiness ── */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 md:p-8 shadow-xs border border-[var(--card-border)] mb-8 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-indigo-300">
                📈 Performance Intelligence
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400 font-semibold">• Real-Time Analytics & Projections</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              Study Time, Accuracy Trajectory & Exam Readiness
            </h3>
          </div>
          <Link
            to="/student/analytics"
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs w-fit"
          >
            <span>Full Analytics Hub</span>
            <span>➔</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Predicted Exam Readiness Pillar */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between border border-slate-800 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                🎯 Predicted Exam Readiness
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">
                  {analytics?.exam_readiness?.readiness_score || 0}%
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  {analytics?.exam_readiness?.pass_probability || 0}% Pass Prob.
                </span>
              </div>
              <p className="text-xs font-bold text-slate-300 mt-1">
                {analytics?.exam_readiness?.tier_display || 'Readiness Evaluation'}
              </p>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {analytics?.exam_readiness?.advice || 'Calculated via syllabus completion, assessment accuracy, and recall.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Coverage: {analytics?.exam_readiness?.components?.lesson_completion_pct || 0}%</span>
              <Link to="/student/analytics" className="text-indigo-300 font-bold hover:underline">
                View Forecast ➔
              </Link>
            </div>
          </div>

          {/* 2. Time Spent Pillar */}
          <div className="bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">
                  ⏱️ Study Time Invested
                </span>
                <span className="text-xs font-bold text-brand-700 dark:text-indigo-300 bg-brand-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  Past 7 Days
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {analytics?.time_spent?.total_study_hours || 0}
                </span>
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400">hours total</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium">
                <span>🧠 {analytics?.time_spent?.total_focus_minutes || 0}m focus</span>
                <span>•</span>
                <span>📺 {analytics?.time_spent?.total_watch_minutes || 0}m lecture</span>
              </div>
            </div>

            {/* Mini 7-day spark bars */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-end justify-between gap-1.5 h-10">
                {(analytics?.time_spent?.daily_breakdown || []).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end" title={`${d.date}: ${d.total_minutes}m`}>
                    <div
                      className="w-full max-w-[18px] bg-brand-600 dark:bg-brand-500 rounded-t-sm"
                      style={{ height: `${Math.max(12, Math.min(100, (d.total_minutes / 60) * 100))}%` }}
                    />
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold mt-1">{d.day_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Accuracy Trends Pillar */}
          <div className="bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">
                  📊 Accuracy Trajectory
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    analytics?.accuracy_trends?.trend_direction === 'UPWARD'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {analytics?.accuracy_trends?.trend_label || 'Stable'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {analytics?.accuracy_trends?.overall_accuracy || 0}%
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">rolling avg</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                {analytics?.accuracy_trends?.passed_attempts || 0} of {analytics?.accuracy_trends?.total_attempts || 0} quiz attempts passed
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-gray-400 dark:text-slate-500 font-medium">Topic Mastery:</span>
              <span className="font-bold text-gray-800 dark:text-white">
                {analytics?.accuracy_trends?.strong_topics?.length || 0} Strong • {analytics?.accuracy_trends?.weak_topics?.length || 0} Weak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dual Intelligence Modules: Weak-Topic Diagnostics & Anki Memory Review ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {/* Topic Strengths Insight Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/15">
                🧠 Weak-Topic Diagnostics
              </span>
            </div>
            <h4 className="text-lg font-black tracking-tight mb-1.5 text-white">
              {adaptiveInsight?.headline || 'Discover Topic Strengths & Weaknesses'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {adaptiveInsight?.recommendation?.slice(0, 120) || 'Target weak areas with auto-generated practice quizzes to rapidly boost comprehension.'}...
            </p>
          </div>
          <Link
            to="/student/topic-strengths"
            className="inline-flex items-center justify-center bg-white text-slate-900 font-extrabold text-xs py-2.5 px-4 rounded-xl hover:bg-slate-100 transition w-fit shadow-xs"
          >
            Diagnostics & Weak Practice ➔
          </Link>
        </div>

        {/* Spaced Repetition Due Card */}
        <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--card-border)] shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-slate-800 text-brand-700 dark:text-indigo-300 border border-brand-100 dark:border-slate-700">
                🔁 Anki Memory Review
              </span>
              {dueCardsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-black animate-pulse">
                  {dueCardsCount} Due Today
                </span>
              )}
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1.5">
              {dueCardsCount > 0
                ? `${dueCardsCount} Flashcard${dueCardsCount > 1 ? 's' : ''} Ready for Memory Review`
                : 'All Spaced Retention Cards Caught Up'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
              Missed answers resurface after 1, 3, 7, 14, and 30 days to systematically convert short-term errors into permanent mastery.
            </p>
          </div>
          <Link
            to="/student/spaced-repetition"
            className="inline-flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition w-fit shadow-xs"
          >
            Review Flashcards ➔
          </Link>
        </div>
      </div>

      {/* ── 2026 Competitive Tech Radar: Trending Programs, Projects & Essential Tools ── */}
      <IndustryTrendsSection />

      {/* ── Courses Section with Search & Stream Tabs ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Explore Curriculum</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Comprehensive lecture modules, study notes, and adaptive quizzes.</p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, skills..."
            className="w-full text-xs bg-[var(--bg-card)] border border-[var(--card-border)] text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-600 shadow-xs"
          />
        </div>
      </div>

      {/* Stream Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedStream(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedStream === tab
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-[var(--bg-card)] border border-[var(--card-border)] text-gray-600 dark:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-800/40'
            }`}
          >
            {tab === 'ALL' ? 'All Courses' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Course Grid with .course-card hover elevation (Part 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            tabIndex={0}
            className="course-card p-6 flex flex-col justify-between group focus:outline-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-800">
                  {course.level}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-slate-400 font-semibold">{course.stream}</span>
              </div>
              <h4 className="text-base font-black text-gray-900 dark:text-white mb-1.5 group-hover:text-brand-600 dark:group-hover:text-indigo-400 transition-colors">
                {course.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4 pt-3 border-t border-gray-100 dark:border-slate-800 font-medium">
                <span>📚 {course.lessons?.length || 0} Lessons</span>
                {course.is_subscription_paused && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    ⏸️ Access Paused
                  </span>
                )}
                <span>⏱️ Self-Paced</span>
              </div>
              <Link
                to={isDemo ? `/demo/courses/${course.id}` : `/student/courses/${course.id}`}
                className={`block text-center text-xs font-bold py-2.5 rounded-xl transition shadow-xs ${
                  course.is_subscription_paused
                    ? 'bg-amber-500 hover:bg-amber-600 text-gray-950 font-black'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {isDemo ? 'Preview Course ➔' : (course.is_subscription_paused ? 'Enter Course (Paused) ➔' : 'Enter Course ➔')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Demo Mode Authentication Prompt Modal */}
      <DemoAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        featureName={authModalFeature}
      />
    </DashboardLayout>
  );
}