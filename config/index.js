/**
 * Dynamic API Configuration for WardrobeNearby
 * 
 * This file automatically detects your network configuration
 * and provides the correct API URL without hardcoding IP addresses.
 * 
 * ✅ Benefits:
 * - Works on any WiFi network (hostel, college, home, etc.)
 * - No more manual IP updates when switching networks
 * - Automatic development vs production switching
 * - Easy debugging with console logs
 */

import Constants from 'expo-constants';

// Method 1: Use Expo's built-in network detection (Recommended)
const getApiUrlFromExpo = () => {
  if (__DEV__) {
    // Get the development server URL from Expo
    const debuggerHost = Constants.expoConfig?.hostUri
      ? Constants.expoConfig.hostUri.split(':').shift()
      : Constants.expoConfig?.debuggerHost?.split(':').shift()
      || 'localhost';
    
    return `http://${debuggerHost}:3000/api`;
  } else {
    // Production URL - replace with your actual production API
    return 'https://your-production-api.com/api';
  }
};

// Method 2: Environment-based (Alternative)
const getApiUrlFromEnv = () => {
  const host = process.env.EXPO_PUBLIC_API_HOST;
  const port = process.env.EXPO_PUBLIC_API_PORT || '3000';
  const protocol = process.env.EXPO_PUBLIC_API_PROTOCOL || 'http';
  
  if (host) {
    return `${protocol}://${host}:${port}/api`;
  }
  
  // Fallback to Expo method
  return getApiUrlFromExpo();
};

// Choose your preferred method:
// Option A: Pure Expo detection (works automatically)
export const API_URL = getApiUrlFromExpo();

// Option B: Environment + Expo fallback (more control)
// export const API_URL = getApiUrlFromEnv();

// Debug logging
console.log('🔧 [API_CONFIG] Network Configuration:');
console.log('📡 Expo hostUri:', Constants.expoConfig?.hostUri);
console.log('🖥️  Debugger host:', Constants.expoConfig?.debuggerHost);
console.log('🌐 Final API URL:', API_URL);
console.log('🏠 Environment:', __DEV__ ? 'Development' : 'Production');

// Export base URL for other uses
export const BASE_URL = API_URL.replace('/api', '');

// Export a function to get fresh URL (useful for debugging)
export const getApiUrl = getApiUrlFromExpo;
