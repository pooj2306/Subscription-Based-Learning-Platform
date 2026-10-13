import axiosInstance from './axiosInstance';

// ─── Gamification & Badges ───
export const getMyGamificationProfile = () =>
  axiosInstance.get('/engagement/profile/');

export const getAllBadges = () =>
  axiosInstance.get('/engagement/badges/');

export const getLeaderboard = () =>
  axiosInstance.get('/engagement/leaderboard/');

// ─── Study Groups ───
export const getStudyGroups = () =>
  axiosInstance.get('/engagement/groups/');

export const getStudyGroupDetail = (groupId) =>
  axiosInstance.get(`/engagement/groups/${groupId}/`);

export const createStudyGroup = (payload) =>
  axiosInstance.post('/engagement/groups/', payload);

export const joinStudyGroup = (groupId) =>
  axiosInstance.post(`/engagement/groups/${groupId}/join/`);

export const leaveStudyGroup = (groupId) =>
  axiosInstance.post(`/engagement/groups/${groupId}/leave/`);

export const postStudyGroupMessage = (groupId, content) =>
  axiosInstance.post(`/engagement/groups/${groupId}/message/`, { content });

// ─── Roadmaps & Skill Trees ───
export const getRoadmaps = () =>
  axiosInstance.get('/engagement/roadmaps/');

export const getRoadmapDetail = (slug) =>
  axiosInstance.get(`/engagement/roadmaps/${slug}/`);

// ─── Focus Mode & Pomodoro ───
export const recordFocusSession = (payload) =>
  axiosInstance.post('/engagement/focus/record/', payload);

export const getRecentFocusSessions = () =>
  axiosInstance.get('/engagement/focus/recent/');
