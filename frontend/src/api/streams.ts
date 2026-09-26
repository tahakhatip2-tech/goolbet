import api from './axios';

export const getStreams = async () => {
  const { data } = await api.get('/streams');
  return data;
};

export const getLiveStreams = async () => {
  const { data } = await api.get('/streams/live');
  return data;
};

export const getStreamById = async (id: string) => {
  const { data } = await api.get(`/streams/${id}`);
  return data;
};

export const placeBet = async (betData: any) => {
  const { data } = await api.post(`/streams/${betData.streamId}/bet`, betData);
  return data;
};

export const getMyBets = async () => {
  const { data } = await api.get('/streams/my/bets');
  return data;
};
