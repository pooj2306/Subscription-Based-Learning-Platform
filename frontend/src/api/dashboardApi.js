import axiosInstance from './axiosInstance';

export const getOverview = () => axiosInstance.get('/dashboard/overview/');
export const getUserStats = () => axiosInstance.get('/dashboard/users/');
export const getRevenueStats = () => axiosInstance.get('/dashboard/revenue/');
export const getCourseStats = () => axiosInstance.get('/dashboard/courses/');
export const getQuizStats = () => axiosInstance.get('/dashboard/quizzes/');