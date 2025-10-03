/**
 * Dynamic API Configuration for WardrobeNearby
 * 
 * This configuration automatically detects and tries multiple IP addresses
 * to find the correct server location, eliminating manual IP updates.
 */

import { Platform } from 'react-native';

// Try to import Constants, with fallback for environments where it's not available
let Constants = null;
try {
  Constants = require('expo-constants').default;
} catch (error) {
  console.log('[DYNAMIC_API] expo-constants not available, using fallback');
}

// Get environment variables with fallbacks
const ENV = {
  API_HOST: process.env.EXPO_PUBLIC_API_HOST,
  API_PORT: process.env.EXPO_PUBLIC_API_PORT || '3000',
  API_PROTOCOL: process.env.EXPO_PUBLIC_API_PROTOCOL || 'http',
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  PRODUCTION_API_URL: process.env.EXPO_PUBLIC_PRODUCTION_API_URL
};

// Auto-detect possible IP addresses from Expo manifest
const getPossibleIPs = () => {
  const ips = [];
  
  // 1. Environment variable (highest priority)
  if (ENV.API_HOST) {
    ips.push(ENV.API_HOST);
  }
  
  // 2. Expo debugger host (auto-detected)
  if (Constants) {
    try {
      const debuggerHost = Constants.expoConfig?.debuggerHost || 
                          Constants.manifest?.debuggerHost || 
                          Constants.manifest2?.extra?.expoClient?.debuggerHost;
      
      if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        if (ip && !ips.includes(ip)) {
          ips.push(ip);
        }
      }
    } catch (error) {
      console.log('[DYNAMIC_API] Could not get debugger host:', error.message);
    }
  }
  
  // 3. Common network IP ranges to try
  const commonIPs = [
    '192.168.10.48',  // Current detected IP
    '192.168.14.31',  // Previous IP
    '192.168.13.145', // Another previous IP
    '10.51.8.5',      // Another previous IP
    '192.168.1.1',    // Common router range
    '192.168.0.1',    // Another common range
    '10.0.0.1',       // Another common range
  ];
  
  commonIPs.forEach(ip => {
    if (!ips.includes(ip)) {
      ips.push(ip);
    }
  });
  
  return ips;
};

// Test if a specific IP is reachable
const testConnection = async (ip, port = ENV.API_PORT, timeout = 3000) => {
  const url = `${ENV.API_PROTOCOL}://${ip}:${port}/api/items`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ [DYNAMIC_API] Connection successful to ${ip}:${port}`);
      return true;
    } else {
      console.log(`⚠️  [DYNAMIC_API] Server responded but with status ${response.status} for ${ip}:${port}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ [DYNAMIC_API] Connection failed to ${ip}:${port}: ${error.message}`);
    return false;
  }
};

// Find the first working IP address
const findWorkingIP = async () => {
  const possibleIPs = getPossibleIPs();
  
  console.log(`🔍 [DYNAMIC_API] Testing ${possibleIPs.length} possible IP addresses...`);
  
  for (const ip of possibleIPs) {
    console.log(`🧪 [DYNAMIC_API] Testing connection to ${ip}:${ENV.API_PORT}...`);
    
    const isWorking = await testConnection(ip, ENV.API_PORT);
    if (isWorking) {
      console.log(`🎉 [DYNAMIC_API] Found working server at ${ip}:${ENV.API_PORT}`);
      return ip;
    }
  }
  
  console.error('🚨 [DYNAMIC_API] No working server found! Tried:', possibleIPs);
  return null;
};

// Cache for the working IP
let cachedWorkingIP = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // Cache for 30 seconds

// Get the current working API URL
export const getDynamicApiUrl = async () => {
  // Check if we have a cached IP that's still fresh
  if (cachedWorkingIP && (Date.now() - lastCheckTime) < CACHE_DURATION) {
    return `${ENV.API_PROTOCOL}://${cachedWorkingIP}:${ENV.API_PORT}/api`;
  }
  
  // Try to find a working IP
  const workingIP = await findWorkingIP();
  
  if (workingIP) {
    cachedWorkingIP = workingIP;
    lastCheckTime = Date.now();
    return `${ENV.API_PROTOCOL}://${workingIP}:${ENV.API_PORT}/api`;
  }
  
  // Fallback to environment variable or localhost
  const fallbackHost = ENV.API_HOST || 'localhost';
  console.log(`⚠️  [DYNAMIC_API] Using fallback: ${fallbackHost}:${ENV.API_PORT}`);
  return `${ENV.API_PROTOCOL}://${fallbackHost}:${ENV.API_PORT}/api`;
};

// Get base URL (for WebSocket connections)
export const getDynamicBaseUrl = async () => {
  const apiUrl = await getDynamicApiUrl();
  return apiUrl.replace('/api', '');
};

// Force refresh the IP cache (call this if connection fails)
export const refreshIPCache = () => {
  console.log('🔄 [DYNAMIC_API] Refreshing IP cache...');
  cachedWorkingIP = null;
  lastCheckTime = 0;
};

// Get static fallback (for immediate use without async)
export const getStaticFallbackUrl = () => {
  const host = ENV.API_HOST || 'localhost';
  return `${ENV.API_PROTOCOL}://${host}:${ENV.API_PORT}/api`;
};

// Export configuration info
export const getConfigInfo = () => ({
  possibleIPs: getPossibleIPs(),
  currentCachedIP: cachedWorkingIP,
  environment: ENV.ENVIRONMENT,
  lastCheck: lastCheckTime
});

export default {
  getDynamicApiUrl,
  getDynamicBaseUrl,
  refreshIPCache,
  getStaticFallbackUrl,
  getConfigInfo
};
