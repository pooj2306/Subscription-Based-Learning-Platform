import axiosInstance from './axiosInstance';

export const getPlans = () => axiosInstance.get('/subscriptions/plans/');
export const getMySubscriptions = () => axiosInstance.get('/subscriptions/my/');
export const subscribeToPlan = (planId) => axiosInstance.post('/subscriptions/subscribe/', { plan_id: planId });
export const pauseSubscription = (subscriptionId) => axiosInstance.post(`/subscriptions/${subscriptionId}/pause/`);
export const resumeSubscription = (subscriptionId) => axiosInstance.post(`/subscriptions/${subscriptionId}/resume/`);
export const cancelSubscription = (subscriptionId) => axiosInstance.post(`/subscriptions/${subscriptionId}/cancel/`);
export const startFreeTrial = () => axiosInstance.post('/subscriptions/start-trial/');
export const getProgressCarryover = () => axiosInstance.get('/subscriptions/progress-carryover/');
export const purchaseCourse = (courseId) => axiosInstance.post('/subscriptions/purchase-course/', { course_id: courseId });
export const getPurchasedCourses = () => axiosInstance.get('/subscriptions/purchased-courses/');
export const getStudentVerification = () => axiosInstance.get('/subscriptions/student-verification/');
export const submitStudentVerification = (data) => axiosInstance.post('/subscriptions/student-verification/', data);
export const getSmartUpsell = () => axiosInstance.get('/subscriptions/smart-upsell/');