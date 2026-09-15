import axiosInstance from './axiosInstance';

export const requestCertificate = (courseId) => axiosInstance.post(`/certificates/request/${courseId}/`);
export const getMyCertificates = () => axiosInstance.get('/certificates/my/');