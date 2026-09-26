import api from './axios';

export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const registerAcademy = async (academyData: any) => {
  const response = await api.post('/auth/register-academy', academyData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const telegramLogin = async (data: any) => {
  const response = await api.post('/auth/telegram-login', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};
