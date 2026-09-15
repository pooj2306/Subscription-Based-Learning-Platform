import axiosInstance from './axiosInstance';

export const registerUser = (data) => axiosInstance.post('/accounts/register/', data);

export const loginUser = (data) => axiosInstance.post('/accounts/login/', data);

export const getProfile = () => axiosInstance.get('/accounts/profile/');

export const logoutUser = (refreshToken) =>
  axiosInstance.post('/accounts/logout/', { refresh: refreshToken });