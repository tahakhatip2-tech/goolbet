import axios from 'axios';

const API_KEY = process.env.RAPIDAPI_KEY || '';
const BASE_URL = 'https://v3.football.api-sports.io';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-apisports-key': API_KEY
  }
});

export const apiFootballService = {
  getCountries: async () => {
    try {
      const response = await apiClient.get('/countries');
      return response.data.response;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  getLeagues: async (country?: string) => {
    try {
      const params = country ? { country } : {};
      const response = await apiClient.get('/leagues', { params });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  },

  getFixtures: async (params: { date?: string; league?: string; season?: string; status?: string; from?: string; to?: string; next?: string }) => {
    try {
      const response = await apiClient.get('/fixtures', { params });
      
      // Check for API-Football specific errors (like free plan restrictions)
      if (response.data.errors && Object.keys(response.data.errors).length > 0) {
        const errorMsg = Object.values(response.data.errors)[0];
        console.error('API-Football Error:', errorMsg);
        throw new Error(errorMsg as string);
      }
      
      return response.data.response;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      throw error;
    }
  },

  getFixtureDetails: async (fixtureId: string) => {
    try {
      const response = await apiClient.get('/fixtures', {
        params: { id: fixtureId }
      });
      return response.data.response?.[0] || null;
    } catch (error) {
      console.error('Error fetching fixture details:', error);
      throw error;
    }
  }
};
