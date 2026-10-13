import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIndustryTrends } from '../api/dashboardApi';

export default function IndustryTrendsSection() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'projects' | 'tools'
  const [selectedToolCategory, setSelectedToolCategory] = useState('ALL');

  useEffect(() => {
    getIndustryTrends()
      .then((res) => setTrends(res.data))
      .catch((err) => console.error('Failed to load industry trends:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 mb-8 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-96 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-gray-100 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!trends) return null;

  const { trending_programs, trending_projects, tools_radar, market_insights } = trends;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 dark:border-slate-800 mb-8 overflow-hidden transition-colors">
      {/* ── Section Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              🌍 Market Pulse & Competitive Edge
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Live 2026 Industry Hiring Demand
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Trending Programs, Projects & Essential Tools
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            What you need to build and master right now to stand out, crack interviews, and thrive in an AI-accelerated job market.
          </p>
        </div>

        {/* ── Interactive View Tabs ── */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-850 p-1 rounded-2xl self-start shrink-0">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'programs'
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>🚀</span>
            <span>Trending Programs</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>💡</span>
            <span>Trending Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>🛠️</span>
            <span>Must-Learn Tools</span>
          </button>
        </div>
      </div>

      {/* ── Live Market Stat Callouts ── */}
      {market_insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {(market_insights.stat_callouts || []).map((c, i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-slate-800 dark:to-indigo-950/40 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                {c.stat}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-700 dark:text-slate-200 font-semibold leading-snug">
                {c.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: TRENDING PROGRAMS ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trending_programs.map((prog) => (
            <div
              key={prog.id}
              className="bg-white dark:bg-slate-850 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between group card-hover relative overflow-hidden"
            >
              <div className="relative z-10">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {prog.badge}
                  </span>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    {prog.growth_rate}
                  </span>
                </div>

                <h4 className="text-base font-black text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug">
                  {prog.title}
                </h4>

                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                  {prog.summary}
                </p>

                {/* Salary Benchmark */}
                <div className="bg-gray-50 dark:bg-slate-900/80 rounded-xl px-3 py-2 mb-4 border border-gray-100 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider">
                    Target Compensation
                  </span>
                  <span className="text-xs font-black text-gray-800 dark:text-slate-200">
                    {prog.salary_range}
                  </span>
                </div>

                {/* Core Competencies */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider mb-1.5">
                    Required Core Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {prog.core_competencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-md"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools to Master */}
                <div className="mb-5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider mb-1.5">
                    Tools in Stack
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {prog.essential_tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 relative z-10">
                {prog.matching_course ? (
                  <Link
                    to={`/student/courses/${prog.matching_course.id}`}
                    className="w-full bg-gray-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-between"
                  >
                    <span>Master in: {prog.matching_course.title.slice(0, 24)}...</span>
                    <span>➔</span>
                  </Link>
                ) : (
                  <Link
                    to="/student/roadmaps"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-between"
                  >
                    <span>Explore Learning Roadmap</span>
                    <span>➔</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: TRENDING PROJECTS ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trending_projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-850 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between card-hover"
            >
              <div>
                {/* Meta tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {proj.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">⏱️ {proj.estimated_time}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                      {proj.difficulty}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-black text-gray-900 dark:text-white mb-2 leading-snug">
                  {proj.title}
                </h4>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {proj.stack.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-[11px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Why Recruiters Love It Box */}
                <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3.5 mb-4">
                  <span className="text-[10px] uppercase font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>💡</span> Why Recruiters Prioritize This:
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                    {proj.why_it_gets_hired}
                  </p>
                </div>

                {/* Architectural highlights */}
                <div className="space-y-1.5 mb-5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider">
                    Key Production Features to Implement
                  </span>
                  {proj.key_highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-300">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                {proj.matching_course ? (
                  <Link
                    to={`/student/courses/${proj.matching_course.id}`}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-between"
                  >
                    <span>Build with: {proj.matching_course.title}</span>
                    <span>➔</span>
                  </Link>
                ) : (
                  <Link
                    to="/student"
                    className="w-full bg-gray-900 dark:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center"
                  >
                    View Project Curriculum ➔
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: MUST-LEARN TOOLS 2026 RADAR ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'tools' && (
        <div>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedToolCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedToolCategory === 'ALL'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              All Categories
            </button>
            {tools_radar.map((group) => (
              <button
                key={group.category}
                onClick={() => setSelectedToolCategory(group.category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedToolCategory === group.category
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {group.category}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {tools_radar
              .filter((g) => selectedToolCategory === 'ALL' || g.category === selectedToolCategory)
              .map((group) => (
                <div
                  key={group.category}
                  className="bg-gray-50/60 dark:bg-slate-850 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800"
                >
                  <div className="mb-4">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{group.category}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{group.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {group.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-2xl">{tool.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                              {tool.badge}
                            </span>
                          </div>

                          <h5 className="font-black text-gray-900 dark:text-white text-sm mb-0.5">{tool.name}</h5>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">{tool.role}</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-slate-500 mb-1">
                            <span>Industry Adoption</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-black">{tool.demand_score}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                              style={{ width: `${tool.demand_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Bottom Market Advisory Banner ── */}
      <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">🎯</span>
          <p className="text-xs text-gray-600 font-medium">
            <span className="font-bold text-gray-900">Career Tip:</span> Recruiters in 2026 evaluate candidates on real architecture: Combine dynamic algorithmic mastery with containerized GenAI or cloud services.
          </p>
        </div>
        <Link
          to="/student/roadmaps"
          className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition shrink-0 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View Complete Skill Roadmaps</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
