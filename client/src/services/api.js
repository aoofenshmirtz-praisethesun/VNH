import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization header if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const loginWorker = async (username, password) => {
  const response = await API.post('/auth/login', { username, password });
  return response.data;
};

export const fetchZonesOverview = async () => {
  const response = await API.get('/zones');
  return response.data;
};

export const fetchZoneHistory = async (zoneName) => {
  const response = await API.get(`/zones/${encodeURIComponent(zoneName)}/history`);
  return response.data;
};

export const fetchZoneTrend = async (zoneName) => {
  const response = await API.get(`/zones/${encodeURIComponent(zoneName)}/trend`);
  return response.data;
};

export const uploadMonthlyRecord = async (zoneName, recordData) => {
  const response = await API.post(`/zones/${encodeURIComponent(zoneName)}/monthly-upload`, recordData);
  return response.data;
};

export const generateAiSummary = async (zoneName) => {
  const response = await API.post(`/zones/${encodeURIComponent(zoneName)}/ai-summary`);
  return response.data;
};

export const fetchCityAiSummary = async () => {
  const response = await API.post('/zones/city-ai-summary');
  return response.data;
};

export default API;
