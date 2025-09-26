import * as SecureStore from 'expo-secure-store';

// REMEMBER TO USE YOUR COMPUTER'S IP ADDRESS
const API_URL = 'http://10.51.8.5:3000/api';

// This is our central function for making API requests
const api = async (endpoint, method = 'GET', body = null) => {
  // Get the token from secure storage
  const token = await SecureStore.getItemAsync('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  // If a token exists, add it to the 'x-auth-token' header
  if (token) {
    headers['x-auth-token'] = token;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on endpoint ${endpoint}:`, error);
    throw error;
  }
};

export default api;