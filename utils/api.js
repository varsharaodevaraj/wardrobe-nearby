import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/apiConfig';

console.log('[API] Using dynamic API URL:', API_URL);

// Global reference to logout function (will be set by AuthContext)
let globalLogout = null;

// Function to set the logout callback
export const setLogoutCallback = (logoutFn) => {
  globalLogout = logoutFn;
};

// This is our central function for making API requests
const api = async (endpoint, method = 'GET', body = null) => {
  const token = await SecureStore.getItemAsync('token');
  
  // Debug logging for token
  if (token) {
    console.log(`[API] Using token for ${endpoint}: ${token.substring(0, 20)}...`);
  } else {
    console.log(`[API] No token found for ${endpoint}`);
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    // Always ensure endpoint starts with "/"
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log('Fetching:', url);

    const response = await fetch(url, config);

    // Handle empty response (204 No Content)
    if (response.status === 204) return {};

    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 && data.message && 
          (data.message.includes('Token is not valid') || 
           data.message.includes('No token, authorization denied'))) {
        
        console.error('[AUTH] Invalid token detected, logging out user');
        
        // Clear invalid token from storage
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        } catch (storageError) {
          console.error('Error clearing auth storage:', storageError);
        }
        
        // Call logout function if available
        if (globalLogout) {
          setTimeout(() => {
            globalLogout();
          }, 100); // Small delay to prevent immediate re-render issues
        }
        
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`🚨 API Error on endpoint ${endpoint}:`, error);
    
    // Enhanced error handling for network issues
    if (error.message?.includes('Network request failed')) {
      console.error(' NETWORK_ERROR] Connection failed to:', `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
      console.error(' [NETWORK_ERROR] Possible solutions:');
      console.error('  1. Check if server is running');
      console.error('  2. Verify IP address in .env.local');
      console.error('  3. Try restarting server and app');
      console.error('  4. Check network connectivity');
    }
    
    throw error;
  }
};

export default api;