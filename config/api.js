import Constants from 'expo-constants';

// Get the development server URL from Expo
const getApiUrl = () => {
  if (__DEV__) {
    // In development, use Expo's debugger host or localhost
    const debuggerHost = Constants.expoConfig?.hostUri
      ? Constants.expoConfig.hostUri.split(':').shift()
      : 'localhost';
    
    return `http://${debuggerHost}:3000/api`;
  } else {
    // In production, use your production API URL
    return 'https://your-production-api.com/api';
  }
};

export const API_URL = getApiUrl();

console.log('[API_CONFIG] Using API URL:', API_URL);
