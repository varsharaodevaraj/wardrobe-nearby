import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Function to get the local network IP automatically
const getLocalNetworkIP = () => {
  if (__DEV__) {
    // Try to get IP from Expo's manifest
    const debuggerHost = Constants.expoConfig?.debuggerHost;
    if (debuggerHost) {
      return debuggerHost.split(':')[0];
    }
    
    // Fallback: try to extract from hostUri
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return hostUri.split(':')[0];
    }
    
    // Final fallback
    return 'localhost';
  }
  
  return null; // Production will use different logic
};

// Main API configuration
const getApiUrl = () => {
  if (__DEV__) {
    const ip = getLocalNetworkIP();
    const apiUrl = `http://${ip}:3000/api`;
    console.log('[API_CONFIG] Auto-detected API URL:', apiUrl);
    return apiUrl;
  } else {
    // Production URL - replace with your actual production API
    return 'https://your-production-api.herokuapp.com/api';
  }
};

export const API_URL = getApiUrl();
export const BASE_URL = API_URL.replace('/api', '');

// Export a function to get fresh API URL (useful for debugging)
export const getApiUrlDynamic = getApiUrl;
