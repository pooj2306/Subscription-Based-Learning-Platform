import { useEffect, useState } from 'react';
import { getLeaderboard, getAllBadges } from '../../api/engagementApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

export default function LeaderboardPage() {
  const [tab, setTab] = useState('leaderboard'); // 'leaderboard' | 'badges'
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [badgesData, setBadgesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [lbRes, bRes] = await Promise.all([getLeaderboard(), getAllBadges()]);
      setLeaderboardData(lbRes.data);
      setBadgesData(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading rankings and achievements...</p>
        </div>
      </DashboardLayout>
    );
  }

  const topLearners = leaderboardData?.top_learners || [];
  const top1 = topLearners[0];
  const top2 = topLearners[1];
  const top3 = topLearners[2];
  const badges = badgesData?.badges || [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-16">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Honors & Leaderboard 🏆
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Compete with students worldwide, maintain your streak, and earn badges.
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl w-fit border border-transparent dark:border-slate-700">
            <button
              onClick={() => setTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer ${
                tab === 'leaderboard'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              🏆 Global Leaderboard
            </button>
            <button
              onClick={() => setTab('badges')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer ${
                tab === 'badges'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              🎖️ Badges ({badgesData?.earned_count || 0}/{badgesData?.total_badges || 0})
            </button>
          </div>
        </div>

        {tab === 'leaderboard' ? (
          <>
            {/* Top 3 Podium */}
            {topLearners.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-2xl mx-auto mb-10 pt-6">
                {/* 2nd Place */}
                <div className="bg-gradient-to-t from-gray-100 dark:from-slate-800 to-white dark:to-slate-900 rounded-3xl p-4 md:p-6 text-center border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center">
                  <span className="text-2xl mb-1">🥈</span>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-black text-base md:text-xl flex items-center justify-center mb-2 shadow-inner uppercase">
                    {top2.username.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-xs md:text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {top2.username}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">{top2.level_title}</p>
                  <span className="mt-2 text-xs font-black px-2.5 py-1 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                    {top2.xp.toLocaleString()} XP
                  </span>
                </div>

                {/* 1st Place Gold */}
                <div className="bg-gradient-to-t from-amber-100/60 dark:from-slate-800 via-amber-50/40 dark:via-slate-850 to-white dark:to-slate-900 rounded-3xl p-5 md:p-8 text-center border-2 border-amber-300 dark:border-amber-500/50 shadow-lg flex flex-col items-center transform -translate-y-2">
                  <span className="text-3xl mb-1 animate-bounce">👑</span>
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-xl md:text-2xl flex items-center justify-center mb-2 shadow-md uppercase">
                    {top1.username.charAt(0)}
                  </div>
                  <h4 className="font-black text-sm md:text-base text-gray-900 dark:text-white truncate max-w-full">
                    {top1.username}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">{top1.level_title}</p>
                  <span className="mt-2 text-xs md:text-sm font-black px-3 py-1 rounded-full bg-amber-400 text-amber-950 shadow-xs">
                    ⚡ {top1.xp.toLocaleString()} XP
                  </span>
                </div>

                {/* 3rd Place */}
                <div className="bg-gradient-to-t from-orange-50 dark:from-slate-800 to-white dark:to-slate-900 rounded-3xl p-4 md:p-6 text-center border border-orange-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center">
                  <span className="text-2xl mb-1">🥉</span>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 font-black text-base md:text-xl flex items-center justify-center mb-2 shadow-inner uppercase">
                    {top3.username.charAt(0)}
                  </div>
                  <h4 className="font-extrabold text-xs md:text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {top3.username}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">{top3.level_title}</p>
                  <span className="mt-2 text-xs font-black px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200">
                    {top3.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                <span>Rank & Student</span>
                <span className="hidden md:inline">Discipline</span>
                <span>Experience Points</span>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {topLearners.map((item) => (
                  <div
                    key={item.user_id}
                    className={`px-6 py-4 flex items-center justify-between transition ${
                      item.is_current_user
                        ? 'bg-brand-50/70 dark:bg-brand-900/20 border-l-4 border-brand-600 font-bold'
                        : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Rank + Avatar + Name */}
                    <div className="flex items-center gap-3.5">
                      <span className={`w-7 text-center font-black text-sm ${
                        item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-gray-400 dark:text-slate-400' : item.rank === 3 ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'
                      }`}>
                        #{item.rank}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center uppercase">
                        {item.username.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                            {item.username}
                          </span>
                          {item.is_current_user && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-600 text-white">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400 font-semibold">
                          Level {item.level} • {item.level_title}
                        </p>
                      </div>
                    </div>

                    {/* Streak & Focus */}
                    <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        🔥 {item.current_streak}d streak
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {item.total_focus_minutes}m focused
                      </span>
                      <span className="flex items-center gap-1">
                        🏅 {item.badge_count} badges
                      </span>
                    </div>

                    {/* XP Badge */}
                    <div className="text-right">
                      <span className="text-sm font-black text-brand-700 dark:text-indigo-300 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl border border-brand-200 dark:border-brand-800">
                        ⚡ {item.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Badges Showcase Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all ${
                  b.is_earned
                    ? 'bg-white dark:bg-slate-900 border-brand-100 dark:border-slate-800 shadow-sm'
                    : 'bg-gray-50/70 dark:bg-slate-900/40 border-gray-200/80 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                      b.is_earned
                        ? 'bg-gradient-to-br from-brand-50 to-indigo-100 dark:from-brand-950/50 dark:to-slate-800 border border-brand-200 dark:border-brand-800'
                        : 'bg-gray-200/70 dark:bg-slate-800 text-gray-400 dark:text-slate-400'
                    }`}
                  >
                    {b.is_earned ? b.icon : '🔒'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                        {b.title}
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shrink-0">
                        +{b.xp_reward} XP
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-2">
                      {b.description}
                    </p>
                    {b.is_earned ? (
                      <span className="text-[10px] font-black text-brand-600 dark:text-indigo-400 flex items-center gap-1">
                        ✓ Unlocked {b.earned_at ? `on ${b.earned_at}` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                        🔒 Not yet unlocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
