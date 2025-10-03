/**
 * Network Connectivity Test
 * 
 * This utility helps test the dynamic API configuration
 */

import { getDynamicApiUrl, getDynamicBaseUrl, getConfigInfo, refreshIPCache } from './dynamicApiConfig';

export const runConnectivityTest = async () => {
  console.log('\n🔍 [CONNECTIVITY_TEST] Starting network connectivity test...\n');
  
  // Show configuration info
  const configInfo = getConfigInfo();
  console.log('📊 [TEST] Current Configuration:');
  console.log('   - Possible IPs:', configInfo.possibleIPs);
  console.log('   - Cached IP:', configInfo.currentCachedIP);
  console.log('   - Environment:', configInfo.environment);
  console.log('   - Last Check:', configInfo.lastCheck ? new Date(configInfo.lastCheck).toLocaleTimeString() : 'Never');
  
  console.log('\n🧪 [TEST] Testing API URL detection...');
  
  try {
    // Test API URL
    const apiUrl = await getDynamicApiUrl();
    console.log('✅ [TEST] API URL detected:', apiUrl);
    
    // Test Base URL
    const baseUrl = await getDynamicBaseUrl();
    console.log('✅ [TEST] Base URL detected:', baseUrl);
    
    // Test actual API call
    console.log('\n📡 [TEST] Testing actual API call...');
    
    const response = await fetch(`${apiUrl}/items`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [TEST] API call successful!');
      console.log('   - Status:', response.status);
      console.log('   - Data length:', Array.isArray(data) ? data.length : 'Not an array');
      
      return {
        success: true,
        apiUrl,
        baseUrl,
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : 0
      };
    } else {
      console.log('⚠️  [TEST] API responded but with error status:', response.status);
      return {
        success: false,
        apiUrl,
        baseUrl,
        error: `HTTP ${response.status}`
      };
    }
    
  } catch (error) {
    console.error('❌ [TEST] Connectivity test failed:', error.message);
    
    // Try refreshing cache and test once more
    console.log('🔄 [TEST] Refreshing IP cache and trying again...');
    refreshIPCache();
    
    try {
      const apiUrl = await getDynamicApiUrl();
      console.log('🔄 [TEST] New API URL after refresh:', apiUrl);
      
      const response = await fetch(`${apiUrl}/items`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ [TEST] Success after IP refresh!');
        return {
          success: true,
          apiUrl,
          retriedAfterRefresh: true,
          status: response.status
        };
      } else {
        console.log('❌ [TEST] Still failing after IP refresh');
        return {
          success: false,
          apiUrl,
          error: `HTTP ${response.status} (after retry)`
        };
      }
      
    } catch (retryError) {
      console.error('❌ [TEST] Retry also failed:', retryError.message);
      return {
        success: false,
        error: `${error.message} (retry: ${retryError.message})`
      };
    }
  }
};

export const quickConnectivityCheck = async () => {
  try {
    const result = await runConnectivityTest();
    
    if (result.success) {
      console.log('\n🎉 [QUICK_CHECK] Network connectivity is working!');
      console.log(`   Connected to: ${result.apiUrl}`);
    } else {
      console.log('\n🚨 [QUICK_CHECK] Network connectivity issues detected');
      console.log(`   Error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('\n💥 [QUICK_CHECK] Test failed to run:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in components
export default {
  runConnectivityTest,
  quickConnectivityCheck
};
