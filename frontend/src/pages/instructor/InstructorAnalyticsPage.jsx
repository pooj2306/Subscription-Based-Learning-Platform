import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInstructorAnalytics } from '../../api/dashboardApi';
import DashboardLayout from '../../components/DashboardLayout';

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, DROPOFF, QUESTIONS

  const loadData = (courseId = '') => {
    setLoading(true);
    getInstructorAnalytics(courseId || undefined)
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(selectedCourseId);
  }, [selectedCourseId]);

  if (loading && !analytics) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Aggregating drop-off funnels & question difficulty metrics...</p>
        </div>
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary || {};
  const courses = analytics?.courses || [];
  const lessonDropoff = analytics?.lesson_dropoff || [];
  const bottlenecks = analytics?.bottlenecks || [];
  const mostMissedQuestions = analytics?.most_missed_questions || [];

  return (
    <DashboardLayout>
      {/* ── Page Header & Course Selector ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              📉 Instructor Teaching Analytics
            </span>
            <span className="text-xs text-gray-400 font-semibold">• Drop-off Funnel & Question Misconceptions</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Curriculum Drop-off & Question Diagnostics
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Pinpoint exact lessons where students lose momentum and identify high-frequency question misconceptions.
          </p>
        </div>

        {/* Course Filter Dropdown & Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs font-bold bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="">All Teaching Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.level})
              </option>
            ))}
          </select>

          <Link
            to="/instructor"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            ← My Courses
          </Link>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Enrolled Students
          </span>
          <p className="text-2xl md:text-3xl font-black text-gray-900">
            {summary.total_enrolled_students || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Across selected curriculum</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Lessons Monitored
          </span>
          <p className="text-2xl md:text-3xl font-black text-indigo-600">
            {summary.total_lessons_tracked || 0}
          </p>
          <p className="text-xs text-indigo-700/80 mt-1">Syllabus progression nodes</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Bottleneck Lessons
          </span>
          <div className="flex items-center gap-2">
            <p className="text-2xl md:text-3xl font-black text-rose-600">
              {summary.bottleneck_lessons_count || 0}
            </p>
            {summary.bottleneck_lessons_count > 0 && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                High Friction
              </span>
            )}
          </div>
          <p className="text-xs text-rose-600/80 mt-1">Drop-off rate &gt; 30%</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Critical Missed Questions
          </span>
          <p className="text-2xl md:text-3xl font-black text-amber-600">
            {summary.critical_questions_count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Questions with &gt; 50% error rate</p>
        </div>
      </div>

      {/* ── Active High-Friction Bottleneck Banner (if any) ── */}
      {bottlenecks.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 border border-rose-200 text-rose-950 px-6 py-5 rounded-3xl mb-8 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h4 className="font-black text-base text-rose-900">
                Action Required: {bottlenecks.length} Lesson Bottleneck{bottlenecks.length > 1 ? 's' : ''} Identified
              </h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                Significant student attrition is occurring at{' '}
                <strong>
                  {bottlenecks.map((b) => `${b.title} (${b.drop_off_rate}% drop-off)`).join(', ')}
                </strong>
                . Consider adding conceptual breakdown illustrations or breaking these into shorter micro-lectures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Section Tabs ── */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'ALL', label: 'All Analytics' },
          { id: 'DROPOFF', label: '📉 Lesson Drop-Off Funnel' },
          { id: 'QUESTIONS', label: '❓ Most Missed Questions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          1. WHICH LESSONS STUDENTS DROP OFF AT (DROP-OFF FUNNEL)
      ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'ALL' || activeTab === 'DROPOFF') && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>📉</span> Lesson Drop-Off & Attrition Funnel
              </h3>
              <p className="text-xs text-gray-400">
                Tracks which lessons students start but abandon before completion.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low Drop-off (&lt;20%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate (20-35%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High Bottleneck (&gt;35%)
              </span>
            </div>
          </div>

          {lessonDropoff.length === 0 ? (
            <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-semibold">No lesson activity recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Student interaction and video progress will appear here as students work through courses.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] uppercase font-black text-gray-400">
                    <th className="py-3 px-3">Order & Lesson</th>
                    <th className="py-3 px-3">Course</th>
                    <th className="py-3 px-3 text-center">Started</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-3 text-center">Dropped Off</th>
                    <th className="py-3 px-3">Drop-Off Rate %</th>
                    <th className="py-3 px-3 text-right">Friction Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {lessonDropoff.map((item) => {
                    const isHigh = item.drop_off_rate >= 35;
                    const isMedium = item.drop_off_rate >= 20 && item.drop_off_rate < 35;

                    return (
                      <tr key={`${item.course_id}-${item.lesson_id}`} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-gray-900">
                            #{item.order} {item.title}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {item.module_name} • {item.duration_minutes}m duration
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-gray-600">
                          {item.course_title}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-gray-700">
                          {item.started_count}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                          {item.completed_count}
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-rose-600">
                          {item.drop_off_count}
                        </td>

                        <td className="py-3.5 px-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 w-11 shrink-0">
                              {item.drop_off_rate}%
                            </span>
                            <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, item.drop_off_rate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {item.is_bottleneck ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              <span>⚠️</span> Bottleneck
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                              <span>✓</span> Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          2. WHICH QUESTIONS ARE MOST OFTEN MISSED
      ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'ALL' || activeTab === 'QUESTIONS') && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100 mb-8">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span>❓</span> Questions Most Often Missed & Misconception Analysis
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Identifies the hardest questions and reveals the primary distractor choice tripping students up.
            </p>
          </div>

          {mostMissedQuestions.length === 0 ? (
            <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-semibold">No question answer submissions yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                As students take quizzes, questions with high miss rates will rank here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mostMissedQuestions.map((q, idx) => (
                <div
                  key={q.question_id}
                  className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs hover:border-gray-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          q.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : q.severity === 'MODERATE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {q.failure_rate}% Miss Rate
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        • {q.topic} ({q.difficulty})
                      </span>
                    </div>

                    <span className="text-xs text-gray-400 font-semibold">
                      Quiz: {q.quiz_title} ({q.course_title})
                    </span>
                  </div>

                  {/* Question Text */}
                  <h4 className="font-extrabold text-sm md:text-base text-gray-900 mb-4">
                    {q.question_text}
                  </h4>

                  {/* Statistics & Misconception Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                    {/* Stat Pillar */}
                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold">Attempts Evaluated:</span>
                      <span className="font-black text-gray-900">{q.total_attempts}</span>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs">
                      <span className="text-emerald-800 font-bold block mb-0.5">
                        ✓ Correct Answer:
                      </span>
                      <span className="text-emerald-950 dark:text-emerald-200 font-extrabold">
                        {q.correct_choice_text || 'Correct Choice'}
                      </span>
                    </div>

                    {/* Misconception Trap */}
                    <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-xs">
                      <span className="text-rose-800 font-bold flex items-center gap-1 mb-0.5">
                        <span>⚠️</span> Misconception Trap ({q.trap_pct}% of failures):
                      </span>
                      <span className="text-rose-950 dark:text-rose-200 font-extrabold">
                        {q.most_common_wrong_choice || 'No common distractor pattern'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
