import axiosInstance from './axiosInstance';

// ─── Topics ───
export const getCourseTopics = (courseId) =>
  axiosInstance.get(`/adaptive/topics/course/${courseId}/`);

export const createTopic = (courseId, data) =>
  axiosInstance.post(`/adaptive/topics/course/${courseId}/`, data);

// ─── Adaptive Quiz (Batch Mode) ───
export const getAdaptiveQuiz = (quizId) =>
  axiosInstance.get(`/adaptive/quiz/${quizId}/adaptive/`);

export const submitAdaptiveQuiz = (quizId, answers) =>
  axiosInstance.post(`/adaptive/quiz/${quizId}/adaptive/submit/`, { answers });

// ─── Interactive Real-Time Adaptive Quiz ───
export const startInteractiveAdaptiveQuiz = (quizId) =>
  axiosInstance.post(`/adaptive/quiz/${quizId}/interactive/start/`);

export const submitInteractiveAnswer = (quizId, payload) =>
  axiosInstance.post(`/adaptive/quiz/${quizId}/interactive/answer/`, payload);

// ─── Topic Strengths Dashboard ───
export const getTopicStrengths = (courseId = null) =>
  courseId
    ? axiosInstance.get(`/adaptive/strengths/course/${courseId}/`)
    : axiosInstance.get('/adaptive/strengths/');

// ─── Weak-Topic Practice Quiz ───
export const getWeakTopicPractice = (courseId = null) =>
  courseId
    ? axiosInstance.get(`/adaptive/practice/course/${courseId}/`)
    : axiosInstance.get('/adaptive/practice/');

export const submitWeakTopicPractice = (answers) =>
  axiosInstance.post('/adaptive/practice/submit/', { answers });

// ─── Spaced Repetition (Anki-style) ───
export const getDueCards = () =>
  axiosInstance.get('/adaptive/spaced/due/');

export const getAllCards = () =>
  axiosInstance.get('/adaptive/spaced/all/');

export const submitSpacedReview = (answers) =>
  axiosInstance.post('/adaptive/spaced/review/', { answers });

export const simulateSpacedDays = (days) =>
  axiosInstance.post('/adaptive/spaced/simulate-days/', { days });

// ─── Student Difficulty Levels ───
export const getMyDifficultyLevels = () =>
  axiosInstance.get('/adaptive/my-levels/');

// ─── Instructor Question & Topic Management ───
export const getInstructorQuizQuestions = (quizId) =>
  axiosInstance.get(`/adaptive/instructor/quiz/${quizId}/questions/`);

export const bulkSetAdaptiveMeta = (questions) =>
  axiosInstance.post('/adaptive/questions/bulk-meta/', { questions });
