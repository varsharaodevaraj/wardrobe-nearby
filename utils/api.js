import * as SecureStore from 'expo-secure-store';
import { getDynamicApiUrl, refreshIPCache, getStaticFallbackUrl } from '../config/dynamicApiConfig';

let globalLogout = null;

export const setLogoutCallback = (logoutFn) => {
  globalLogout = logoutFn;
};

const api = async (endpoint, method = 'GET', body = null, retryCount = 0) => {
  const token = await SecureStore.getItemAsync('token');
  
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
    let apiUrl;
    try {
      apiUrl = await getDynamicApiUrl();
    } catch (error) {
      console.warn('[API] Failed to get dynamic API URL, using fallback:', error.message);
      apiUrl = getStaticFallbackUrl();
    }
    
    const url = `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`[API] Fetching (attempt ${retryCount + 1}):`, url);

    const response = await fetch(url, config);

    if (!response.ok) {
      // Try to parse the error response as JSON
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If it's not JSON, throw a generic error
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      if (response.status === 401 && errorData.message && 
          (errorData.message.includes('Token is not valid') || 
           errorData.message.includes('No token, authorization denied'))) {
        
        console.error('[AUTH] Invalid token detected, logging out user');
        
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('user');
        } catch (storageError) {
          console.error('Error clearing auth storage:', storageError);
        }
        
        if (globalLogout) {
          setTimeout(() => {
            globalLogout();
          }, 100);
        }
        
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle empty response (204 No Content)
    if (response.status === 204) return {};
    
    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`🚨 API Error on endpoint ${endpoint}:`, error);
    
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch')) {
      
      console.error(`❌ [NETWORK_ERROR] Connection failed on attempt ${retryCount + 1}`);
      
      if (retryCount === 0) {
        console.log('🔄 [API] Refreshing server IP cache and retrying...');
        refreshIPCache();
        return api(endpoint, method, body, retryCount + 1);
      }
      
      console.error('🚨 [NETWORK_ERROR] All connection attempts failed');
      console.error('   [NETWORK_ERROR] Possible solutions:');
      console.error('    1. Check if server is running');
      console.error('    2. Restart the server: cd WardrobeNearby-Server && node index.js');
      console.error('    3. Check network connectivity');
      console.error('    4. Try restarting the React Native app');
    }
    
    throw error;
  }
};

export default api;