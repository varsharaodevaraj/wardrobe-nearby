import * as SecureStore from 'expo-secure-store';
// Import from the new unified config file
import { API_URL } from '../config/apiConfig';

let globalLogout = null;

export const setLogoutCallback = (logoutFn) => {
  globalLogout = logoutFn;
};

const api = async (endpoint, method = 'GET', body = null) => {
  const token = await SecureStore.getItemAsync('token');

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`[API] Fetching:`, url);

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Handle token expiration gracefully
      if (response.status === 401 && errorData.message &&
          (errorData.message.includes('Token is not valid') ||
           errorData.message.includes('No token, authorization denied'))) {

        console.error('[AUTH] Invalid token detected, logging out user.');

        if (globalLogout) {
          // Use a short timeout to ensure the logout call happens outside the current render cycle
          setTimeout(() => {
            globalLogout();
          }, 100);
        }
        
        // Return null instead of throwing an error. The logout function will handle the UI change.
        return null;
      }

      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) return {};

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`🚨 API Error on endpoint ${endpoint}:`, error.message);
    
    if (error.message?.includes('Network request failed')) {
        console.error('   [NETWORK_ERROR] Connection failed. Please check the following:');
        console.error('    1. Is the server running on your computer?');
        console.error('    2. Is the IP address in your .env.local file correct?');
        console.error('    3. Are your phone and computer on the same Wi-Fi network?');
    }
    throw error;
  }
};

export default api;