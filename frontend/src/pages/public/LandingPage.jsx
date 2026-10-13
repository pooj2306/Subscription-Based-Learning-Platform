import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../../api/courseApi';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    getCourses()
      .then((res) => {
        setCourses(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load courses preview:', err);
      })
      .finally(() => {
        setLoadingCourses(false);
      });
  }, []);

  // Show first 6 courses for the preview
  const previewCourses = courses.slice(0, 6);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200 overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* ── Background Subtle Decorative Elements (respects reduced-motion) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-400/10 dark:bg-amber-400/10 rounded-full blur-3xl" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-extrabold text-base shadow-md group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none block">
                SBLP
              </span>
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 tracking-wider uppercase block">
                Adapt and Learn
              </span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-slate-300">
            <a href="#why-us" className="hover:text-brand-600 dark:hover:text-white transition">
              Why Learn With Us
            </a>
            <a href="#courses" className="hover:text-brand-600 dark:hover:text-white transition">
              Explore Courses
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-white transition">
              How It Works
            </a>
            <Link to="/help" className="hover:text-brand-600 dark:hover:text-white transition">
              Help Desk
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <span className="text-lg leading-none" role="img" aria-label="Sun">☀️</span>
              ) : (
                <span className="text-lg leading-none" role="img" aria-label="Moon">🌙</span>
              )}
            </button>

            {user ? (
              <Link
                to={user.role === 'STUDENT' ? '/student' : user.role === 'INSTRUCTOR' ? '/instructor' : '/admin'}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition"
              >
                Go to Dashboard ➔
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-block px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/demo"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 dark:bg-white text-white dark:text-slate-950 hover:bg-brand-700 dark:hover:bg-slate-100 transition shadow-xs"
                >
                  Start Demo
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── PART 1 HERO SECTION: ADAPT AND LEARN ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Concept badge & Eyebrow text */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-brand-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-5">
              <span>🌱</span>
              <span>YOUR LEARNING JOURNEY STARTS HERE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-gray-950 dark:text-white tracking-tight leading-[1.15] mb-5">
              Learn at Your Pace.{' '}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-indigo-400 dark:via-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                Grow Without Limits.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Explore courses, build practical skills, and make learning part of your everyday life. Start exploring with a demo or create your free account to begin your journey.
            </p>

            {/* Three Main Action Buttons (Desktop horizontal row) */}
            <div className="w-full mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xl">
                {/* 1. Start Demo - Primary */}
                <Link
                  to="/demo"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm text-center shadow-lg shadow-brand-700/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>Start Demo</span>
                </Link>

                {/* 2. Log In - Secondary */}
                <Link
                  to="/login"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-extrabold text-sm text-center shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Log In
                </Link>

                {/* 3. Register for Free - Secondary */}
                <Link
                  to="/register"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-slate-700 text-brand-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-slate-700 font-extrabold text-sm text-center shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Register for Free
                </Link>
              </div>
            </div>

            {/* Short descriptions below the buttons */}
            <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-gray-500 dark:text-slate-400 mb-8 pb-6 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-start gap-1.5">
                <span className="text-brand-600 font-bold">•</span>
                <span><strong>Start Demo:</strong> Explore without creating an account.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-gray-400 font-bold">•</span>
                <span><strong>Log In:</strong> Continue with your existing account.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-brand-600 dark:text-brand-400 font-bold">•</span>
                <span><strong>Register for Free:</strong> Track your learning progress.</span>
              </div>
            </div>

            {/* Compact row of benefits */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-xs font-bold text-gray-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-slate-800 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-xs">✓</span>
                <span>Self-Paced Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-slate-800 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-xs">✓</span>
                <span>Practical Skills</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-slate-800 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-xs">✓</span>
                <span>Flexible 24/7 Access</span>
              </div>
            </div>
          </div>

          {/* Right Column: Educational Illustrations and Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Illustration Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 bg-[var(--bg-card)] group">
                <img
                  src="/images/students_learning.jpg"
                  alt="Students studying collaboratively on laptops and reading books at a modern desk"
                  className="w-full h-auto object-cover transform group-hover:scale-102 transition duration-500"
                />

                {/* Subtle Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">Collaborative Study & Mastery</p>
                      <p className="text-[10px] text-gray-300">Students learning on laptops, reading, and building projects</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-brand-600/90 rounded-lg font-bold text-white">Adapt & Learn</span>
                  </div>
                </div>
              </div>

              {/* Floating Pill: Skill Mastery Progress */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-[var(--bg-card)] rounded-2xl p-3.5 shadow-xl border border-[var(--card-border)] flex items-center gap-3 animate-float hidden sm:flex">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-800 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                  💻
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white">Active Curriculum</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">● Self-Paced Chapters</p>
                </div>
              </div>

              {/* Floating Pill: Verified Progress */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-[var(--bg-card)] rounded-2xl p-3.5 shadow-xl border border-[var(--card-border)] flex items-center gap-3 hidden sm:flex">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
                  🎓
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white">Project-Verified</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">Certificates of Completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: WHY LEARN WITH US? ── */}
      <section id="why-us" className="relative z-10 py-16 bg-[var(--bg-card)] border-y border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Platform Strengths
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-3 mb-2">
              Why Learn With Us?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Structured to support your growth from fundamentals through advanced technical mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="card-hover bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-4 border border-indigo-100 dark:border-indigo-800">
                  ⏱️
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">
                  Learn at Your Own Pace
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Study lessons whenever your schedule allows. Resume automatically right where you left off without any pressure.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-hover bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-4 border border-indigo-100 dark:border-indigo-800">
                  📚
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">
                  Explore Multiple Subjects
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Access rich topics from Algorithms and Full-Stack Development to Artificial Intelligence and Machine Learning.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-hover bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-4 border border-indigo-100 dark:border-indigo-800">
                  🛠️
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">
                  Build Practical Skills
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Engage in hands-on exercises, review verified code implementations, and solve real-world technical problems.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="card-hover bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-brand-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-4 border border-indigo-100 dark:border-indigo-800">
                  📊
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">
                  Track Your Learning Progress
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  Monitor module completion percentages, track study streaks, and earn completion certificates as you advance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: EXPLORE COURSES (REAL COURSE DATA & .course-card HOVER) ── */}
      <section id="courses" className="relative z-10 py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Curriculum Catalogue
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-3">
              Explore Courses
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Real learning tracks created by experienced instructors. Hover over any course to preview details.
            </p>
          </div>

          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:bg-brand-700 dark:hover:bg-slate-100 transition shadow-xs self-start sm:self-auto"
          >
            <span>Explore All Courses (Demo)</span>
            <span>➔</span>
          </Link>
        </div>

        {/* Course Cards Grid */}
        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : previewCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewCourses.map((course) => (
              <div
                key={course.id}
                tabIndex={0}
                className="course-card p-6 flex flex-col justify-between group focus:outline-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-brand-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {course.level || 'All Levels'}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                      {course.stream || 'Technology'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-3 mb-5 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4 pt-3 border-t border-gray-100 dark:border-slate-800 font-medium">
                    <span>📚 {course.lessons?.length || 0} Lessons</span>
                    <span>⏱️ Self-Paced</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to="/demo"
                      className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold text-center transition shadow-xs"
                    >
                      Preview Course ➔
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[var(--bg-card)] rounded-3xl border border-[var(--card-border)]">
            <p className="text-sm text-gray-500">No courses published yet.</p>
          </div>
        )}
      </section>

      {/* ── SECTION: HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-16 bg-[var(--bg-card)] border-y border-[var(--card-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Your 3-Step Path
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-3 mb-2">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Clear, transparent, and focused on helping you build real competence without roadblocks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-7 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  1. Explore
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  Discover courses and learning resources. Browse lesson lists, course syllabi, and test platform features instantly in Demo Mode without requiring an account.
                </p>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-indigo-400">
                Browse catalogue →
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-7 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white font-black text-lg flex items-center justify-center mb-5 shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  2. Learn
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  Study lessons at your own pace. Watch concise instructional videos, review comprehensive reading notes, and use the built-in Pomodoro timer to maintain focus.
                </p>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-indigo-400">
                Self-paced mastery →
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-50/50 dark:bg-slate-900/70 border border-[var(--card-border)] rounded-3xl p-7 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-800 text-white font-black text-lg flex items-center justify-center mb-5 shadow-sm">
                3
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  3. Track Your Progress
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                  Review your progress after registering and logging in. Complete quizzes, assess topic strengths, earn experience points, and claim verifiable course certificates.
                </p>
              </div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-indigo-400">
                Certificates & analytics →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION SECTION ── */}
      <section className="relative z-10 py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/70 border border-indigo-700/60 px-3 py-1 rounded-full mb-4">
              Begin Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
              Ready to begin your learning adventure?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8">
              Join students mastering modern technology skills. Explore freely in Demo Mode or register your free student account in under a minute.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/demo"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm shadow-md transition"
              >
                ⚡ Start Demo
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs sm:text-sm shadow-md transition"
              >
                Register for Free ➔
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 bg-[var(--bg-card)] border-t border-[var(--card-border)] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="text-base font-extrabold text-gray-900 dark:text-white">SBLP • Adapt and Learn</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-500 dark:text-slate-400">
              <Link to="/demo" className="hover:text-brand-600 dark:hover:text-white transition">
                Demo Mode
              </Link>
              <Link to="/login" className="hover:text-brand-600 dark:hover:text-white transition">
                Log In
              </Link>
              <Link to="/register" className="hover:text-brand-600 dark:hover:text-white transition">
                Register for Free
              </Link>
              <Link to="/help" className="hover:text-brand-600 dark:hover:text-white transition">
                Help Desk & Support
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 dark:text-slate-400">
            <p>© {new Date().getFullYear()} SBLP Learning Platform. All rights reserved.</p>
            <p>Designed with adaptable curriculum, student intelligence & focus timers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
