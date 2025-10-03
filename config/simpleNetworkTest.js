/**
 * Simple Network Test Utility
 * 
 * Lightweight version without external dependencies
 */

// Simple network test function
export const testNetworkConnection = async () => {
  const possibleHosts = [
    '192.168.10.48', // Current detected IP
    '192.168.14.31', // Previous IP
    '192.168.13.145', // Another previous IP
    '10.51.8.5'      // Another previous IP
  ];

  console.log('🔍 [NETWORK_TEST] Testing network connectivity...');

  for (const host of possibleHosts) {
    try {
      const url = `http://${host}:3000/api/items`;
      console.log(`🧪 Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ [NETWORK_TEST] Connected to server at ${host}:3000`);
        return { 
          success: true, 
          host,
          apiUrl: `http://${host}:3000/api`,
          baseUrl: `http://${host}:3000`
        };
      }
    } catch (error) {
      console.log(`❌ [NETWORK_TEST] Failed to connect to ${host}: ${error.message}`);
    }
  }
  
  console.log('🚨 [NETWORK_TEST] No working server found');
  return { 
    success: false, 
    error: 'No server responding on any known IP' 
  };
};

// Quick test for app startup
export const quickNetworkCheck = async () => {
  try {
    const result = await testNetworkConnection();
    
    if (result.success) {
      console.log(`🎉 [NETWORK] Server found at ${result.host}`);
    } else {
      console.log('⚠️  [NETWORK] Server connection issues');
    }
    
    return result;
  } catch (error) {
    console.error('💥 [NETWORK] Test error:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  testNetworkConnection,
  quickNetworkCheck
};
