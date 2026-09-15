import axiosInstance from './axiosInstance';

export const getCourses = () => axiosInstance.get('/courses/');
export const getCourseDetail = (id) => axiosInstance.get(`/courses/${id}/`);
export const getLessons = (courseId) => axiosInstance.get(`/courses/${courseId}/lessons/`);