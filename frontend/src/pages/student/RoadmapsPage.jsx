import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRoadmaps, getRoadmapDetail } from '../../api/engagementApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await getRoadmaps();
      setRoadmaps(res.data);
      if (res.data.length > 0) {
        loadRoadmapDetail(res.data[0].slug);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoadmapDetail = async (slug) => {
    setLoadingDetail(true);
    try {
      const res = await getRoadmapDetail(slug);
      setSelectedRoadmap(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Constructing learning skill tree...</p>
        </div>
      </DashboardLayout>
    );
  }

  const nodes = selectedRoadmap?.nodes || [];
  const totalStages = nodes.length;
  const completedStages = nodes.filter((n) => n.is_completed).length;
  const roadmapProgressPercent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-16">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-7 md:p-8 shadow-xl mb-8 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-400/30">
                <span>🗺️</span> Adaptive Skill Trees & Progression
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                {selectedRoadmap?.title || 'Interactive Learning Roadmaps'}
              </h2>
              <p className="text-indigo-200/90 text-sm max-w-xl leading-relaxed">
                {selectedRoadmap?.tagline || 'Sequential skill trees where completing one course unlocks the next stage in your career path.'}
              </p>
            </div>

            {/* Overall Progress Circle / Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:w-60 shrink-0 text-center">
              <span className="text-xs uppercase font-extrabold text-indigo-200 tracking-wider">
                Roadmap Mastery
              </span>
              <div className="flex items-center justify-center gap-2 my-1">
                <span className="text-3xl font-black text-white">{roadmapProgressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-brand-400 to-amber-300 h-full rounded-full transition-all duration-700"
                  style={{ width: `${roadmapProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-indigo-300 mt-2 font-medium">
                {completedStages} of {totalStages} Stages Mastered
              </p>
            </div>
          </div>
        </div>

        {/* Roadmap Selector Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Tracks:
          </span>
          {roadmaps.map((r) => {
            const isSelected = selectedRoadmap?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => loadRoadmapDetail(r.slug)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.title}</span>
              </button>
            );
          })}
        </div>

        {/* Visual Skill Tree Vertical Timeline */}
        {loadingDetail ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-400 font-medium">Loading skill tree stages...</div>
        ) : (
          <div className="relative">
            {/* Central Vertical Connector Line */}
            <div className="absolute left-6 md:left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-brand-600 via-indigo-500 to-slate-300 dark:to-slate-800 rounded-full z-0" />

            <div className="space-y-6 relative z-10">
              {nodes.map((node, idx) => {
                const isUnlocked = node.is_unlocked;
                const isCompleted = node.is_completed;
                const isNextInLine = isUnlocked && !isCompleted;

                return (
                  <div
                    key={node.id}
                    className={`ml-0 pl-16 md:pl-20 relative transition-all ${
                      isUnlocked ? 'opacity-100' : 'opacity-70'
                    }`}
                  >
                    {/* Node Bullet Icon on the vertical line */}
                    <div
                      className={`absolute left-2 md:left-4 top-6 w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-md transition-all ${
                        isCompleted
                          ? 'bg-brand-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                          : isNextInLine
                          ? 'bg-gradient-to-br from-brand-600 to-indigo-500 text-white ring-4 ring-brand-200 dark:ring-brand-900 animate-pulse'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {isCompleted ? '✓' : isUnlocked ? node.icon : '🔒'}
                    </div>

                    {/* Skill Tree Node Card */}
                    <div
                      className={`rounded-2xl p-6 transition-all duration-300 border ${
                        isCompleted
                          ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-xs'
                          : isNextInLine
                          ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-lg ring-1 ring-brand-400/50'
                          : 'bg-gray-50/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          {/* Stage Pill & XP Reward */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Stage {node.stage_order}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              ⚡ +{node.reward_xp} XP Reward
                            </span>
                            {isCompleted && (
                              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                🌟 Unlocked & Mastered
                              </span>
                            )}
                            {!isUnlocked && (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                                🔒 Locked Prerequisite
                              </span>
                            )}
                          </div>

                          {/* Course Title & Tag */}
                          <h4 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-1">
                            {node.course_title}
                          </h4>
                          <p className="text-xs font-semibold text-brand-600 dark:text-indigo-400 mb-2">
                            {node.skill_tag}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-xl">
                            {node.short_description || 'Master core foundational principles and complete all module assessments to unlock the subsequent career milestones.'}
                          </p>

                          {/* Prerequisites warning if locked */}
                          {!isUnlocked && node.prerequisite_titles?.length > 0 && (
                            <div className="mt-3 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl w-fit">
                              ⚠️ Prerequisite required: Complete <span className="font-bold underline">{node.prerequisite_titles.join(', ')}</span> first.
                            </div>
                          )}
                        </div>

                        {/* Action Buttons & Progress */}
                        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                          {isUnlocked ? (
                            <Link
                              to={`/student/courses/${node.course_id}`}
                              className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black transition flex items-center gap-2 shadow-xs ${
                                isCompleted
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-brand-600 hover:bg-brand-700 text-white'
                              }`}
                            >
                              <span>{isCompleted ? 'Review Course ➔' : 'Start Stage ➔'}</span>
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed flex items-center gap-2"
                            >
                              <span>🔒 Locked</span>
                            </button>
                          )}

                          {isUnlocked && (
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                              Progress: {node.progress_percent}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
