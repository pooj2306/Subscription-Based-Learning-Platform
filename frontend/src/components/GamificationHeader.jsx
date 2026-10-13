import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyGamificationProfile } from '../api/engagementApi';

export default function GamificationHeader() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyGamificationProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !profile) {
    return (
      <div className="h-12 bg-white/40 animate-pulse rounded-2xl mb-6" />
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-gray-100/80 dark:border-slate-800 shadow-xs px-5 py-3.5 mb-6 flex flex-wrap items-center justify-between gap-4 transition-colors">
      {/* Left: Streak & Level */}
      <div className="flex items-center gap-4">
        {/* Streak Flame */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 px-3 py-1.5 rounded-xl">
          <span className="text-xl animate-bounce leading-none">🔥</span>
          <div>
            <span className="text-xs font-black text-orange-950 dark:text-orange-200 uppercase tracking-tight">
              {profile.current_streak} Day Streak
            </span>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold leading-none">
              Best: {profile.longest_streak}d
            </p>
          </div>
        </div>

        {/* Level & Title */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-300">
            L{profile.level}
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">
              {profile.level_title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${profile.level_progress_percent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">
                {profile.xp_current_level_progress}/500 XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: XP Total & Leaderboard Link */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100/80 dark:border-indigo-900 px-3 py-1.5 rounded-xl">
          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">⚡</span>
          <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
            {profile.xp.toLocaleString()} XP
          </span>
        </div>

        <Link
          to="/student/leaderboard"
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
        >
          <span>🏆</span>
          <span className="hidden md:inline">Leaderboard</span>
        </Link>

        <Link
          to="/student/roadmaps"
          className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-brand-800 dark:text-indigo-300 border border-brand-200/60 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <span>🗺️</span>
          <span className="hidden md:inline">Skill Trees</span>
        </Link>
      </div>
    </div>
  );
}
