import axiosInstance from './axiosInstance';

export const getPlans = () => axiosInstance.get('/subscriptions/plans/');
export const getMySubscriptions = () => axiosInstance.get('/subscriptions/my/');
export const subscribeToPlan = (planId) => axiosInstance.post('/subscriptions/subscribe/', { plan_id: planId });