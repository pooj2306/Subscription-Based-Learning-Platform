import axiosInstance from './axiosInstance';

export const getMyCourseProgress = () => axiosInstance.get('/progress/my/');
export const getCourseProgressDetail = (courseId) => axiosInstance.get(`/progress/my/${courseId}/`);
export const updateLessonProgress = (data) => axiosInstance.post('/progress/update/', data);