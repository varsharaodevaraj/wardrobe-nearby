import Constants from 'expo-constants';

// Get environment variables (these work with Expo)
const ENV = {
  API_HOST: process.env.EXPO_PUBLIC_API_HOST,
  API_PORT: process.env.EXPO_PUBLIC_API_PORT || '3000',
  API_PROTOCOL: process.env.EXPO_PUBLIC_API_PROTOCOL || 'http',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  PRODUCTION_API_URL: process.env.EXPO_PUBLIC_PRODUCTION_API_URL
};

const getApiUrl = () => {
  // If we have explicit host configuration
  if (ENV.API_HOST) {
    const url = `${ENV.API_PROTOCOL}://${ENV.API_HOST}:${ENV.API_PORT}/api`;
    console.log('[API_CONFIG] Using environment-configured URL:', url);
    return url;
  }
  
  // Fallback to Expo's auto-detection in development
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri
      ? Constants.expoConfig.hostUri.split(':').shift()
      : 'localhost';
    
    const url = `http://${debuggerHost}:3000/api`;
    console.log('[API_CONFIG] Using Expo auto-detected URL:', url);
    return url;
  } else {
    // Production
    const url = ENV.PRODUCTION_API_URL || 'https://your-production-api.com/api';
    console.log('[API_CONFIG] Using production URL:', url);
    return url;
  }
};

export const API_URL = getApiUrl();
console.log('[API_CONFIG] Final API URL:', API_URL);