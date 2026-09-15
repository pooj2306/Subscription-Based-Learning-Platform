import axiosInstance from './axiosInstance';

export const getCourseQuizzes = (courseId) => axiosInstance.get(`/assessments/course/${courseId}/quizzes/`);
export const getQuizToTake = (quizId) => axiosInstance.get(`/assessments/${quizId}/take/`);
export const submitQuiz = (quizId, answers) => axiosInstance.post(`/assessments/${quizId}/submit/`, { answers });
export const getMyAttempts = () => axiosInstance.get('/assessments/my-attempts/');