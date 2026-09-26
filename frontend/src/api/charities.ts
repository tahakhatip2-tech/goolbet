import api from './axios';

export interface Charity {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  totalReceived: number;
  isActive: boolean;
  _count?: { votes: number };
}

export const getAllCharities = async (): Promise<Charity[]> => {
  const { data } = await api.get('/charities');
  return data;
};

export const createCharity = async (charityData: { name: string; description?: string; logo?: string }) => {
  const { data } = await api.post('/admin/charities', charityData);
  return data;
};

export const updateCharity = async (id: string, charityData: Partial<Charity>) => {
  const { data } = await api.put(`/admin/charities/${id}`, charityData);
  return data;
};

export const deleteCharity = async (id: string) => {
  const { data } = await api.delete(`/admin/charities/${id}`);
  return data;
};
