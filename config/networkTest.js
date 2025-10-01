/**
 * Network Test Utility for WardrobeNearby
 * 
 * This utility helps test API connectivity and debug network issues
 */

import { API_URL } from './apiConfig';

// Test basic connectivity
export const testApiConnection = async () => {
  console.log('[NETWORK_TEST] Testing API connection...');
  console.log('NETWORK_TEST] Target URL:', API_URL);
  
  try {
    const startTime = Date.now();
    
    // Try a simple health check
    const response = await fetch(`${API_URL.replace('/api', '')}/`, {
      method: 'GET',
      timeout: 5000
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      console.log('[NETWORK_TEST] Connection successful!');
      console.log(`[NETWORK_TEST] Response time: ${responseTime}ms`);
      return { success: true, responseTime, status: response.status };
    } else {
      console.log('[NETWORK_TEST] Server responded but not OK');
      console.log(`[NETWORK_TEST] Status: ${response.status}`);
      return { success: false, status: response.status, responseTime };
    }
  } catch (error) {
    console.log('[NETWORK_TEST] Connection failed!');
    console.log('[NETWORK_TEST] Error:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('Network request failed')) {
      console.log(' [NETWORK_TEST] Possible causes:');
      console.log('  1. Server is not running');
      console.log('  2. Wrong IP address (network changed)');
      console.log('  3. Firewall blocking connection');
      console.log('  4. Server crashed or not listening');
    }
    
    return { success: false, error: error.message };
  }
};

// Get current network info
export const getNetworkInfo = () => {
  const info = {
    currentIP: API_URL,
    isEnvironmentSet: !!process.env.EXPO_PUBLIC_API_HOST,
    isDevelopment: __DEV__
  };
  
  console.log('📱 [NETWORK_INFO] Current configuration:', info);
  return info;
};

// Quick connectivity test (call this from your app)
export const quickTest = async () => {
  console.log('\n🚀 [QUICK_TEST] Starting network diagnostics...\n');
  
  getNetworkInfo();
  const result = await testApiConnection();
  
  console.log('\n[QUICK_TEST] Summary:');
  if (result.success) {
    console.log('Your API is reachable and working!');
  } else {
    console.log('API connection failed');
    console.log('Next steps:');
    console.log('  1. Check if your server is running');
    console.log('  2. Verify the IP in .env.local matches your server');
    console.log('  3. Try restarting both server and app');
  }
  
  return result;
};
