import { useEffect, useState } from 'react';
import {
  getStudyGroups,
  getStudyGroupDetail,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  postStudyGroupMessage,
} from '../../api/engagementApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    icon: '🚀',
    target_weekly_xp: 2500,
    target_weekly_focus_minutes: 500,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await getStudyGroups();
      setGroups(res.data);
      if (res.data.length > 0) {
        loadGroupDetail(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getStudyGroupDetail(id);
      setSelectedGroup(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await joinStudyGroup(id);
      loadGroups();
      loadGroupDetail(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = async (id) => {
    try {
      await leaveStudyGroup(id);
      loadGroups();
      loadGroupDetail(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGroup) return;
    setSendingMsg(true);
    try {
      await postStudyGroupMessage(selectedGroup.id, messageInput.trim());
      setMessageInput('');
      loadGroupDetail(selectedGroup.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await createStudyGroup(newGroupForm);
      setShowCreateModal(false);
      setNewGroupForm({
        name: '',
        description: '',
        icon: '🚀',
        target_weekly_xp: 2500,
        target_weekly_focus_minutes: 500,
      });
      loadGroups();
      loadGroupDetail(res.data.id);
    } catch (err) {
      alert('Failed to create study group.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading collaborative study groups...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-16">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* Top Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>👥</span> Collaborative Learning Guilds
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Study Groups with Shared Weekly Goals
            </h2>
            <p className="text-gray-600 dark:text-slate-300 text-sm mt-1">
              Join forces with fellow students. Every quiz passed and focus session logged contributes to your group's weekly target!
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs md:text-sm shadow-md transition flex items-center gap-2 cursor-pointer w-fit"
          >
            <span>➕</span>
            <span>Create Study Group</span>
          </button>
        </div>

        {/* Layout: Left Sidebar of Groups + Right Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Cards Column */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Active Guilds ({groups.length})
            </h3>

            {groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => loadGroupDetail(g.id)}
                  className={`p-5 rounded-2xl transition cursor-pointer border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'bg-white dark:bg-slate-900 border border-card-border dark:border-slate-800 shadow-xs hover:border-brand-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.icon}</span>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                        {g.name}
                      </h4>
                    </div>
                    {g.is_member && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Joined
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {g.description || 'Dedicated study collective.'}
                  </p>

                  {/* Goal Progress Bar */}
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${g.goal_progress_percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
                    <span>{g.current_weekly_xp.toLocaleString()} / {g.target_weekly_xp.toLocaleString()} XP</span>
                    <span className="font-bold text-brand-600 dark:text-indigo-400">{g.goal_progress_percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Selected Group Detail Panel */}
          <div className="lg:col-span-2">
            {loadingDetail || !selectedGroup ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center text-gray-400 dark:text-slate-400 border border-card-border dark:border-slate-800">
                Loading guild workspace...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Hero Card for Group */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-7 shadow-lg border border-slate-800 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/10 shadow-sm">
                        {selectedGroup.icon}
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                          {selectedGroup.name}
                        </h3>
                        <p className="text-xs text-slate-300 font-semibold mt-0.5">
                          {selectedGroup.member_count} active members • {selectedGroup.weekly_goal_title}
                        </p>
                      </div>
                    </div>

                    {/* Join / Leave Button */}
                    <div>
                      {selectedGroup.is_member ? (
                        <button
                          onClick={() => handleLeave(selectedGroup.id)}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-bold transition border border-white/10 cursor-pointer"
                        >
                          Leave Guild
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(selectedGroup.id)}
                          className="px-6 py-2.5 rounded-xl bg-white text-slate-900 font-black text-xs md:text-sm hover:bg-gray-100 shadow-md transition cursor-pointer"
                        >
                          Join This Guild ➔
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shared Goal Progress Box */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                        🎯 Shared Weekly Collective Goal
                      </span>
                      <span className="text-xs font-black text-white">
                        {selectedGroup.goal_progress_percent}% Achieved
                      </span>
                    </div>

                    <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 h-full rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${selectedGroup.goal_progress_percent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Current XP</span>
                        <span className="text-base font-black text-white">
                          ⚡ {selectedGroup.current_weekly_xp.toLocaleString()} / {selectedGroup.target_weekly_xp.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Focus Time</span>
                        <span className="text-base font-black text-white">
                          ⏱️ {selectedGroup.current_weekly_focus_minutes} / {selectedGroup.target_weekly_focus_minutes} mins
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guild Members Leaderboard */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                    <span>Member Contributions This Week</span>
                    <span className="text-xs text-gray-400 dark:text-slate-400 font-semibold">{selectedGroup.memberships?.length || 0} Members</span>
                  </h4>

                  <div className="space-y-2.5">
                    {selectedGroup.memberships?.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center uppercase">
                            {mem.username.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {mem.username}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-400 ml-2">
                              {mem.role === 'LEADER' ? '👑 Leader' : 'Fellow'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className="text-brand-700 dark:text-indigo-300 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-lg">
                            +{mem.weekly_contributed_xp} XP
                          </span>
                          <span className="text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            ⏱️ {mem.weekly_contributed_minutes}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group Cheer & Discussion Wall */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-3">
                    💬 Guild Cheer Wall & Discussion
                  </h4>

                  {/* Messages Feed */}
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                    {selectedGroup.messages?.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-slate-400 italic py-2">No cheers posted yet. Be the first to motivate your team!</p>
                    ) : (
                      selectedGroup.messages?.map((msg) => (
                        <div key={msg.id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-800 dark:text-white">{msg.username}</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Post Form */}
                  {selectedGroup.is_member ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Cheer on your group or share your study session goals..."
                        className="flex-1 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !messageInput.trim()}
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {sendingMsg ? 'Posting...' : 'Post 🚀'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-2 text-xs text-gray-400 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                      Join this guild to contribute cheers and updates.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Create Study Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    placeholder="e.g. Algorithms & LeetCode Sprint"
                    className="w-full text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Guild Icon (Emoji)</label>
                  <input
                    type="text"
                    value={newGroupForm.icon}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, icon: e.target.value })}
                    className="w-20 text-center text-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                    placeholder="What will members accomplish together?"
                    className="w-full text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Weekly XP Goal</label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={newGroupForm.target_weekly_xp}
                      onChange={(e) => setNewGroupForm({ ...newGroupForm, target_weekly_xp: parseInt(e.target.value) || 1000 })}
                      className="w-full text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Weekly Focus Mins</label>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={newGroupForm.target_weekly_focus_minutes}
                      onChange={(e) => setNewGroupForm({ ...newGroupForm, target_weekly_focus_minutes: parseInt(e.target.value) || 300 })}
                      className="w-full text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {creating ? 'Creating...' : 'Create Guild 🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
