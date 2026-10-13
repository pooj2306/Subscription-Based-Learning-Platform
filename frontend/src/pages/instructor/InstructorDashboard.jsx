import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCourses } from '../../api/instructorApi';
import { getInstructorAnalytics } from '../../api/dashboardApi';
import { useAuth } from '../../auth/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyCourses(),
      getInstructorAnalytics().catch(() => ({ data: null })),
    ])
      .then(([coursesRes, analyticsRes]) => {
        const mine = coursesRes.data.filter((c) => c.instructor_name === user.username);
        setMyCourses(mine);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      })
      .finally(() => setLoading(false));
  }, [user.username]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading instructor portal & teaching analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  const summary = analytics?.summary || {};
  const bottlenecks = analytics?.bottlenecks || [];
  const mostMissedQuestions = analytics?.most_missed_questions || [];

  return (
    <DashboardLayout>
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              👨‍🏫 Instructor Headquarters
            </span>
            <span className="text-xs text-gray-400 font-semibold">• Live Teaching Platform</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Curriculum & Performance Command
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage your courses, track student drop-off bottlenecks, and review most missed questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/instructor/analytics"
            className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-brand-900 dark:text-white border border-gray-200 dark:border-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
          >
            <span>📉</span> Drop-Off Analytics
          </Link>
          <Link
            to="/instructor/courses/new"
            className="bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition shadow-xs flex items-center gap-1.5"
          >
            <span>+</span> Add Course
          </Link>
        </div>
      </div>

      {/* ── Teaching Analytics Highlight Banner ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">
              <span>📊</span> Teaching Intelligence Report
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-2">
              Student Retention & Assessment Insights
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-4">
              Real-time telemetry on which lessons students drop off at, completion funnels, and questions with high failure rates.
            </p>

            <Link
              to="/instructor/analytics"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md"
            >
              <span>Explore Detailed Drop-Off & Question Diagnostics</span>
              <span>➔</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-80 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-xl block mb-0.5">👥</span>
              <p className="text-xl font-black text-white">{summary.total_enrolled_students || 0}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Active Students</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-xl block mb-0.5">📚</span>
              <p className="text-xl font-black text-teal-400">{summary.total_lessons_tracked || 0}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Lessons Tracked</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-xl block mb-0.5">⚠️</span>
              <p className="text-xl font-black text-rose-400">{summary.bottleneck_lessons_count || 0}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Drop-off Bottlenecks</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-xl block mb-0.5">❓</span>
              <p className="text-xl font-black text-amber-400">{summary.critical_questions_count || 0}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">High-Miss Questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── High-Priority Bottleneck Alert (if any) ── */}
      {bottlenecks.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-extrabold text-sm text-rose-900">
                {bottlenecks.length} Critical Lesson Bottleneck{bottlenecks.length > 1 ? 's' : ''} Detected
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                Students are dropping off at{' '}
                <strong>
                  {bottlenecks.slice(0, 2).map((b) => `${b.title} (${b.drop_off_rate}% drop-off)`).join(', ')}
                </strong>
                .
              </p>
            </div>
          </div>
          <Link
            to="/instructor/analytics"
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-xs shrink-0 text-center"
          >
            Review Bottlenecks ➔
          </Link>
        </div>
      )}

      {/* ── My Courses Section ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-gray-900">My Taught Courses</h3>
          <p className="text-xs text-gray-500 mt-0.5">Courses published under your instructor profile.</p>
        </div>
      </div>

      {myCourses.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
          <span className="text-4xl block mb-2">📚</span>
          <p className="text-gray-700 font-bold text-sm">You haven't created any courses yet.</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Start sharing your knowledge by authoring your first curriculum module.</p>
          <Link
            to="/instructor/courses/new"
            className="inline-block bg-gray-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black transition shadow-xs"
          >
            + Create First Course
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {myCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                  {course.level}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <h4 className="text-base font-black text-gray-900 mb-1 group-hover:text-brand-600 transition">
                {course.title}
              </h4>
              <p className="text-xs text-gray-500 mb-4">{course.stream}</p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pt-3 border-t border-gray-50 font-medium">
                <span>📚 {course.lessons?.length || 0} Lessons</span>
                <Link
                  to={`/instructor/analytics`}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Drop-Off Data ➔
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/instructor/courses/${course.id}/lessons`}
                  className="text-center bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-black transition shadow-xs"
                >
                  Lessons
                </Link>
                <Link
                  to={`/instructor/courses/${course.id}/quizzes`}
                  className="text-center bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold py-2.5 rounded-xl hover:bg-purple-100 transition"
                >
                  Quizzes & Topics
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}