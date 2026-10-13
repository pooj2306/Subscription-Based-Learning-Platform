import axiosInstance from './axiosInstance';

export const getOverview = () => axiosInstance.get('/dashboard/overview/');
export const getUserStats = () => axiosInstance.get('/dashboard/users/');
export const getRevenueStats = () => axiosInstance.get('/dashboard/revenue/');
export const getCourseStats = () => axiosInstance.get('/dashboard/courses/');
export const getQuizStats = () => axiosInstance.get('/dashboard/quizzes/');

// Advanced Analytics for Student and Instructor Dashboards
export const getStudentAnalytics = (studentId) => {
  const params = studentId ? { student_id: studentId } : {};
  return axiosInstance.get('/dashboard/analytics/student/', { params });
};

export const getInstructorAnalytics = (courseId) => {
  const params = courseId ? { course_id: courseId } : {};
  return axiosInstance.get('/dashboard/analytics/instructor/', { params });
};

// 2026 Competitive Tech Intelligence: Trending Programs, Projects & Essential Tools
export const getIndustryTrends = () => axiosInstance.get('/dashboard/industry-trends/');

// Help Desk Support Ticket Submission
export const submitSupportTicket = (ticketData) => axiosInstance.post('/dashboard/support-tickets/', ticketData);