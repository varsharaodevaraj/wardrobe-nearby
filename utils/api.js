import * as SecureStore from 'expo-secure-store';
import { getDynamicApiUrl, refreshIPCache, getStaticFallbackUrl } from '../config/dynamicApiConfig';

// Global reference to logout function (will be set by AuthContext)
let globalLogout = null;

// Function to set the logout callback
export const setLogoutCallback = (logoutFn) => {
  globalLogout = logoutFn;
};

// This is our central function for making API requests with dynamic server detection
const api = async (endpoint, method = 'GET', body = null, retryCount = 0) => {
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
    // Get dynamic API URL (auto-detects correct server IP)
    let apiUrl;
    try {
      apiUrl = await getDynamicApiUrl();
    } catch (error) {
      console.warn('[API] Failed to get dynamic API URL, using fallback:', error.message);
      apiUrl = getStaticFallbackUrl();
    }
    
    // Always ensure endpoint starts with "/"
    const url = `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`[API] Fetching (attempt ${retryCount + 1}):`, url);

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
    
    // Enhanced error handling for network issues with auto-retry
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch')) {
      
      console.error(`❌ [NETWORK_ERROR] Connection failed on attempt ${retryCount + 1}`);
      
      // If this is the first attempt, refresh IP cache and retry
      if (retryCount === 0) {
        console.log('🔄 [API] Refreshing server IP cache and retrying...');
        refreshIPCache();
        return api(endpoint, method, body, retryCount + 1);
      }
      
      // If retry failed, provide detailed error info
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