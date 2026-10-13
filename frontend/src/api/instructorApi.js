import axiosInstance from './axiosInstance';

export const getMyCourses = () => axiosInstance.get('/courses/');
export const createCourse = (data) => axiosInstance.post('/courses/', data);
export const updateCourse = (id, data) => axiosInstance.patch(`/courses/${id}/`, data);
export const deleteCourse = (id) => axiosInstance.delete(`/courses/${id}/`);

export const getCourseLessons = (courseId) => axiosInstance.get(`/courses/${courseId}/lessons/`);
export const createLesson = (courseId, data) => axiosInstance.post(`/courses/${courseId}/lessons/`, data);
export const updateLesson = (lessonId, data) => axiosInstance.patch(`/courses/lessons/${lessonId}/`, data);

export const createQuiz = (courseId, data) => axiosInstance.post(`/assessments/course/${courseId}/quizzes/`, data);