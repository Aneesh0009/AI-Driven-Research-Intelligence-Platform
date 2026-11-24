import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2-minute timeout for openalex + vector + RAG LLM pipeline
});

export const analyzeResearch = async (data) => {
  const response = await apiClient.post('/research/analyze', data);
  return response.data;
};

export const getAnalysisById = async (analysisId) => {
  const response = await apiClient.get(`/research/${analysisId}`);
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
