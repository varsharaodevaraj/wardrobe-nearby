import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

console.log('🚀 [API] Using dynamic API URL:', API_URL);


// This is our central function for making API requests
const api = async (endpoint, method = 'GET', body = null) => {
  const token = await SecureStore.getItemAsync('token');

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    // ✅ Always ensure endpoint starts with "/"
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log('🌐 Fetching:', url);

    const response = await fetch(url, config);

    // Handle empty response (204 No Content)
    if (response.status === 204) return {};

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`🚨 API Error on endpoint ${endpoint}:`, error);
    throw error;
  }
};

export default api;