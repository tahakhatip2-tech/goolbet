import api from './axios';

export interface StreamData {
  id: string;
  title: string;
  streamType: string;
  status: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  thumbnailUrl?: string;
  _count?: { bets: number; comments: number };
}

export interface AcademyProfile {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  isVerified: boolean;
  city: string;
  country: string;
  description: string;
  phone: string;
  website: string;
}

export const getMyAcademy = async () => {
  const { data } = await api.get('/academies/my/profile');
  return data;
};

export const updateMyAcademy = async (formData: FormData) => {
  const { data } = await api.put('/academies/my/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const getMyStreams = async () => {
  const { data } = await api.get('/academies/my/streams');
  return data;
};

export const createStream = async (formData: FormData) => {
  const { data } = await api.post('/academies/my/streams', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const updateStream = async (id: string, formData: FormData) => {
  const { data } = await api.put(`/academies/my/streams/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const deleteStream = async (id: string) => {
  const { data } = await api.delete(`/academies/my/streams/${id}`);
  return data;
};

export const getAcademyStats = async () => {
  const { data } = await api.get('/academies/my/stats');
  return data;
};

export const updateScore = async (id: string, updateData: any) => {
  const { data } = await api.put(`/academies/my/streams/${id}/score`, updateData);
  return data;
};

export const startStream = async (id: string, streamUrl?: string) => {
  const { data } = await api.post(`/academies/my/streams/${id}/start`, { streamUrl });
  return data;
};

export const endStream = async (id: string) => {
  const { data } = await api.post(`/academies/my/streams/${id}/end`);
  return data;
};
