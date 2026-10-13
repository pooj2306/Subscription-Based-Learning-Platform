import axiosInstance from './axiosInstance';

export const getMyCertificates = () =>
  axiosInstance.get('/certificates/');

export const getCourseCertStatus = (courseId) =>
  axiosInstance.get(`/certificates/course/${courseId}/status/`);

export const getCourseMiniProject = (courseId) =>
  axiosInstance.get(`/certificates/course/${courseId}/project/`);

export const submitCourseMiniProject = (courseId, payload) =>
  axiosInstance.post(`/certificates/course/${courseId}/project/submit/`, payload);

export const requestCertificate = (courseId) =>
  axiosInstance.post(`/certificates/course/${courseId}/request/`);