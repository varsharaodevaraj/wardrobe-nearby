import Constants from 'expo-constants';

/**
 * Dynamic API Configuration for WardrobeNearby
 * 
 * This single file handles all API URL detection scenarios:
 * ✅ Environment variables (highest priority)
 * ✅ Expo auto-detection (development)
 * ✅ Production fallback
 * ✅ Works on any network automatically
 */

// Get environment variables
const ENV = {
  API_HOST: process.env.EXPO_PUBLIC_API_HOST,
  API_PORT: process.env.EXPO_PUBLIC_API_PORT || '3000',
  API_PROTOCOL: process.env.EXPO_PUBLIC_API_PROTOCOL || 'http',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  PRODUCTION_API_URL: process.env.EXPO_PUBLIC_PRODUCTION_API_URL
};

// Auto-detect local network IP from Expo
const getAutoDetectedIP = () => {
  if (!__DEV__) return null;
  
  try {
    // Method 1: Try hostUri (most reliable)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      console.log(' [API_CONFIG] Auto-detected IP from hostUri:', ip);
      
      // Validate IP format
      if (ip && ip !== 'localhost' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return ip;
      }
    }
    
    // Method 2: Try debuggerHost
    const debuggerHost = Constants.expoConfig?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      console.log(' [API_CONFIG] Auto-detected IP from debuggerHost:', ip);
      
      // Validate IP format
      if (ip && ip !== 'localhost' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return ip;
      }
    }
    
    // Fallback
    console.log(' [API_CONFIG] Could not auto-detect valid IP, using localhost');
    console.log(' [API_CONFIG] Tip: Set EXPO_PUBLIC_API_HOST in .env.local for manual override');
    return 'localhost';
  } catch (error) {
    console.warn(' [API_CONFIG] Error auto-detecting IP:', error);
    return 'localhost';
  }
};

// Main API URL resolution
const getApiUrl = () => {
  // Priority 1: Explicit environment configuration
  if (ENV.API_HOST) {
    const url = `${ENV.API_PROTOCOL}://${ENV.API_HOST}:${ENV.API_PORT}/api`;
    console.log(' [API_CONFIG] Using environment-configured URL:', url);
    return url;
  }
  
  // Priority 2: Development auto-detection
  if (__DEV__) {
    const ip = getAutoDetectedIP();
    const url = `http://${ip}:3000/api`;
    console.log(' [API_CONFIG] Using auto-detected development URL:', url);
    return url;
  }
  
  // Priority 3: Production URL
  if (ENV.PRODUCTION_API_URL) {
    const url = ENV.PRODUCTION_API_URL.endsWith('/api') 
      ? ENV.PRODUCTION_API_URL 
      : `${ENV.PRODUCTION_API_URL}/api`;
    console.log(' [API_CONFIG] Using production URL:', url);
    return url;
  }
  
  // Fallback
  console.error('[API_CONFIG] No API URL configuration found!');
  return 'http://localhost:3000/api';
};

// Export the configured API URL
export const API_URL = getApiUrl();
export const BASE_URL = API_URL.replace('/api', '');

// Utility functions
export const getApiUrlDynamic = getApiUrl; // For debugging
export const isProduction = !__DEV__;
export const isDevelopment = __DEV__;

// Debug logging
console.log(' [API_CONFIG] Configuration Summary:');
console.log(' Environment:', ENV.ENVIRONMENT);
console.log(' Mode:', __DEV__ ? 'Development' : 'Production');
console.log(' Final API URL:', API_URL);
console.log(' Base URL:', BASE_URL);

// Log environment variables (only in development)
if (__DEV__) {
  console.log(' [API_CONFIG] Environment Variables:');
  console.log('  - API_HOST:', ENV.API_HOST || 'not set (will auto-detect)');
  console.log('  - API_PORT:', ENV.API_PORT);
  console.log('  - API_PROTOCOL:', ENV.API_PROTOCOL);
  console.log('  - PRODUCTION_API_URL:', ENV.PRODUCTION_API_URL || 'not set');
  
  // Log Expo detection info
  console.log(' [API_CONFIG] Expo Detection:');
  console.log('  - hostUri:', Constants.expoConfig?.hostUri || 'not available');
  console.log('  - debuggerHost:', Constants.expoConfig?.debuggerHost || 'not available');
  
  // Show configuration priority
  if (ENV.API_HOST) {
    console.log(' [API_CONFIG] Using: Environment variable override');
  } else {
    console.log(' [API_CONFIG] Using: Expo auto-detection');
  }
}
