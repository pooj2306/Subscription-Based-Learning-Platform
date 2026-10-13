import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentAnalytics } from '../../api/dashboardApi';
import DashboardLayout from '../../components/DashboardLayout';
import GamificationHeader from '../../components/GamificationHeader';

export default function StudentAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, TIME, ACCURACY, READINESS

  useEffect(() => {
    getStudentAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">Computing predictive analytics & performance trends...</p>
        </div>
      </DashboardLayout>
    );
  }

  const timeSpent = analytics?.time_spent || {};
  const accuracyTrends = analytics?.accuracy_trends || {};
  const examReadiness = analytics?.exam_readiness || {};
  const dailyBreakdown = timeSpent.daily_breakdown || [];
  const maxDailyMinutes = Math.max(...dailyBreakdown.map((d) => d.total_minutes), 60);

  // Colors for readiness tiers
  const tierColors = {
    EXAM_READY: 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-800 bg-emerald-50',
    PASSING_READY: 'from-blue-500 to-indigo-600 border-blue-400 text-blue-800 bg-blue-50',
    MODERATE: 'from-amber-500 to-orange-600 border-amber-400 text-amber-800 bg-amber-50',
    EARLY_STAGE: 'from-rose-500 to-pink-600 border-rose-400 text-rose-800 bg-rose-50',
  };

  const readinessColor = tierColors[examReadiness.readiness_tier] || tierColors.MODERATE;

  return (
    <DashboardLayout>
      <GamificationHeader />

      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              📈 Student Intelligence Hub
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">• Real-Time Analytics</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Study Analytics & Exam Readiness
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-slate-300 mt-1">
            Monitor actual time invested, chronological accuracy trajectories, and algorithmic exam readiness.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Insights' },
            { id: 'READINESS', label: '🎯 Exam Readiness' },
            { id: 'TIME', label: '⏱️ Time Spent' },
            { id: 'ACCURACY', label: '📊 Accuracy Trends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          1. PREDICTED EXAM READINESS HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'ALL' || activeTab === 'READINESS') && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
            {/* Left: Score Gauge & Tier */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Animated Circular Gauge representation */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#readinessGrad)"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (examReadiness.readiness_score || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {examReadiness.readiness_score}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Readiness</span>
                </div>
              </div>

              {/* Status & Verdict */}
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2 border border-white/10">
                  <span>🏆</span> {examReadiness.tier_display || 'Readiness Evaluation'}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">
                  Estimated Pass Probability: <span className="text-emerald-400">{examReadiness.pass_probability}%</span>
                </h3>
                <p className="text-xs md:text-sm text-indigo-200/90 max-w-lg leading-relaxed">
                  {examReadiness.advice}
                </p>
              </div>
            </div>

            {/* Right: 4-Pillar Weighted Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:w-96 shrink-0 flex flex-col gap-3">
              <p className="text-[11px] uppercase font-black tracking-wider text-gray-400 mb-1">
                Readiness Formula Components (100% Total)
              </p>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">📚 Syllabus Lesson Coverage (35%)</span>
                  <span className="text-white font-bold">{examReadiness.components?.lesson_completion_pct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${examReadiness.components?.lesson_completion_pct || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">🎯 Quiz Accuracy (35%)</span>
                  <span className="text-white font-bold">{examReadiness.components?.quiz_accuracy_pct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${examReadiness.components?.quiz_accuracy_pct || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">🔁 Spaced Recall Retention (15%)</span>
                  <span className="text-white font-bold">{examReadiness.components?.sr_retention_pct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${examReadiness.components?.sr_retention_pct || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">🛠️ Capstone Mini-Project (15%)</span>
                  <span className="text-white font-bold">{examReadiness.components?.project_completion_pct}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${examReadiness.components?.project_completion_pct || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Recommendations Bar */}
          {examReadiness.action_items && (
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-300">Priority Next Steps:</span>
                {examReadiness.action_items.weak_topics_to_revise?.length > 0 ? (
                  examReadiness.action_items.weak_topics_to_revise.map((topic, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    >
                      ⚠️ Revise {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-300">
                    ✅ No critical weak topics detected
                  </span>
                )}
                {examReadiness.action_items.due_flashcards > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    🔁 {examReadiness.action_items.due_flashcards} Flashcards Due
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/student/topic-strengths"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
                >
                  Diagnostic Quizzes ➔
                </Link>
                <Link
                  to="/student/spaced-repetition"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition"
                >
                  Clear Flashcards ➔
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          2. TIME SPENT SECTION (7-DAY BREAKDOWN + STATS)
      ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'ALL' || activeTab === 'TIME') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 7-Day Interactive Activity Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xs border border-card-border dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⏱️</span> Study Time Distribution (Past 7 Days)
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Focus Pomodoro deep work vs interactive video lecture time.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-brand-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" /> Focus Time
                </span>
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Lectures
                </span>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
              {dailyBreakdown.map((day, idx) => {
                const totalPercent = Math.min(100, Math.round((day.total_minutes / maxDailyMinutes) * 100));
                const focusPercent = day.total_minutes > 0 ? (day.focus_minutes / day.total_minutes) * totalPercent : 0;
                const lecturePercent = day.total_minutes > 0 ? (day.lecture_minutes / day.total_minutes) * totalPercent : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none shadow-lg z-20 whitespace-nowrap">
                      {day.date}: {day.total_minutes}m ({day.focus_minutes}m focus, {day.lecture_minutes}m watch)
                    </div>

                    <div className="w-full max-w-[42px] bg-gray-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex flex-col-reverse justify-start transition-all duration-500 group-hover:brightness-105"
                         style={{ height: `${Math.max(8, totalPercent)}%` }}>
                      {/* Focus minutes segment */}
                      <div
                        className="w-full bg-brand-600 transition-all duration-500"
                        style={{ height: `${day.total_minutes > 0 ? (day.focus_minutes / day.total_minutes) * 100 : 0}%` }}
                      />
                      {/* Lecture minutes segment */}
                      <div
                        className="w-full bg-teal-400 transition-all duration-500"
                        style={{ height: `${day.total_minutes > 0 ? (day.lecture_minutes / day.total_minutes) * 100 : 0}%` }}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 mt-2">
                      {day.day_name}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
                      {day.total_minutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Summary Stats Card (1 col) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-card-border dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span> Study Investment Totals
              </h4>

              <div className="space-y-4">
                <div className="bg-indigo-50/70 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-[11px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Total Hours Logged</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white mt-0.5">
                    {timeSpent.total_study_hours || 0} <span className="text-sm font-semibold text-brand-600 dark:text-indigo-400">hrs</span>
                  </p>
                  <p className="text-xs text-indigo-800 dark:text-slate-400 mt-1">
                    {timeSpent.total_study_minutes || 0} total minutes across all sessions
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50/70 dark:bg-slate-800/50 rounded-2xl p-3 border border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">Focus Mode</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{timeSpent.total_focus_minutes || 0}m</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Pomodoro work</p>
                  </div>
                  <div className="bg-gray-50/70 dark:bg-slate-800/50 rounded-2xl p-3 border border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">Lectures</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{timeSpent.total_watch_minutes || 0}m</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Videos & notes</p>
                  </div>
                </div>

                <div className="bg-gray-50/70 dark:bg-slate-800/50 rounded-2xl p-3 border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">Streak Multiplier</p>
                    <p className="text-base font-black text-gray-900 dark:text-white">{timeSpent.streak_days || 0} Days Running</p>
                  </div>
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                ✨ High consistency correlates with +28% exam scores
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          3. ACCURACY TRENDS & CHRONOLOGICAL PERFORMANCE
      ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'ALL' || activeTab === 'ACCURACY') && (
        <div className="space-y-8 mb-10">
          {/* Accuracy Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-card-border dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Cumulative Accuracy
              </span>
              <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                {accuracyTrends.overall_accuracy || 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Across all quiz submissions</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-card-border dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Recent 5-Quiz Average
              </span>
              <p className="text-2xl md:text-3xl font-black text-brand-600 dark:text-indigo-400">
                {accuracyTrends.recent_accuracy || 0}%
              </p>
              <p className="text-xs text-indigo-700 dark:text-slate-400 mt-1">Latest comprehension trajectory</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-card-border dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Momentum Vector
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                    accuracyTrends.trend_direction === 'UPWARD'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : accuracyTrends.trend_direction === 'DOWNWARD'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {accuracyTrends.trend_label || 'Stable'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Rolling vs historic baseline</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-card-border dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Evaluations Cleared
              </span>
              <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                {accuracyTrends.passed_attempts || 0} / {accuracyTrends.total_attempts || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Quizzes passed successfully</p>
            </div>
          </div>

          {/* Chronological Quiz Timeline & Topic Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline of Quiz Attempts */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-card-border dark:border-slate-800">
              <h4 className="text-base font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <span>📜</span> Chronological Quiz History
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Recent assessment scores and progression checkpoints.
              </p>

              {accuracyTrends.attempt_history?.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">No quiz attempts recorded yet.</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Take a course quiz to start tracking accuracy trends.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {accuracyTrends.attempt_history?.slice().reverse().map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800/60 bg-gray-50/60 dark:bg-slate-800/40 hover:bg-gray-100/60 dark:hover:bg-slate-850 transition flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                          {att.quiz_title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                          {att.course_title} • {att.date}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            att.percentage >= 70
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : att.percentage >= 50
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                          }`}
                        >
                          {att.percentage}%
                        </span>
                        <span className="text-xs">
                          {att.passed ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Trajectory & Mastery Ratings */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-card-border dark:border-slate-800">
              <h4 className="text-base font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <span>🧠</span> Topic Mastery & Elo Ratings
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Adaptive topic skill estimates derived from question difficulty responses.
              </p>

              {accuracyTrends.topic_breakdown?.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">No topic diagnostic data yet.</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Answer topic-tagged questions to unlock detailed analytics.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                  {accuracyTrends.topic_breakdown?.map((topic) => (
                    <div
                      key={topic.topic_id}
                      className="p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800/60 bg-gray-50/40 dark:bg-slate-800/40 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {topic.topic_name}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              topic.strength_label === 'strong'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : topic.strength_label === 'average'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {topic.strength_label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-900 dark:text-white">{topic.accuracy}%</span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 ml-1.5 font-bold">Elo {topic.elo_rating}</span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            topic.accuracy >= 75
                              ? 'bg-brand-500'
                              : topic.accuracy >= 50
                              ? 'bg-teal-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
