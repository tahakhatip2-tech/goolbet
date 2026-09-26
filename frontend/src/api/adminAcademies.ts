import api from './axios';

export interface AdminAcademy {
  id: string;
  name: string;
  logo: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    createdAt: string;
  };
  _count: {
    streams: number;
  };
}

export const getAllAcademies = async (): Promise<AdminAcademy[]> => {
  const { data } = await api.get('/admin/academies');
  return data;
};

export const verifyAcademy = async (id: string, isVerified: boolean) => {
  const { data } = await api.put(`/admin/academies/${id}/verify`, { isVerified });
  return data;
};

export const toggleAcademyStatus = async (id: string) => {
  const { data } = await api.put(`/admin/academies/${id}/toggle-status`);
  return data;
};
