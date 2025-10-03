/**
 * Simple Network Test Utility
 * 
 * Lightweight version without external dependencies
 */

// Generate comprehensive IP ranges for any WiFi network
const generatePossibleIPs = () => {
  const ips = [];
  
  // 1. Known working IPs (highest priority)
  const knownIPs = [
    '192.168.10.48', // Current detected IP
    '192.168.14.31', // Previous IP
    '192.168.13.145', // Another previous IP
    '10.51.8.5'      // Another previous IP
  ];
  ips.push(...knownIPs);
  
  // 2. Common router IP ranges (works on most WiFi networks)
  const commonRanges = [
    // 192.168.1.x network (most common)
    ...Array.from({length: 20}, (_, i) => `192.168.1.${100 + i}`),
    
    // 192.168.0.x network (second most common)  
    ...Array.from({length: 20}, (_, i) => `192.168.0.${100 + i}`),
    
    // 192.168.10.x network (current range)
    ...Array.from({length: 50}, (_, i) => `192.168.10.${1 + i}`),
    
    // 192.168.2.x - 192.168.20.x networks
    ...Array.from({length: 19}, (_, subnet) => 
      Array.from({length: 10}, (_, host) => `192.168.${subnet + 2}.${100 + host}`)
    ).flat(),
    
    // 10.x.x.x network ranges (corporate/mobile hotspots)
    ...Array.from({length: 10}, (_, i) => `10.0.0.${100 + i}`),
    ...Array.from({length: 10}, (_, i) => `10.51.8.${1 + i}`),
  ];
  
  // Add unique IPs only
  commonRanges.forEach(ip => {
    if (!ips.includes(ip)) {
      ips.push(ip);
    }
  });
  
  return ips;
};

// Simple network test function with comprehensive IP scanning
export const testNetworkConnection = async () => {
  const possibleHosts = generatePossibleIPs();

  console.log(`🔍 [NETWORK_TEST] Testing ${possibleHosts.length} possible IP addresses...`);
  console.log('🏃‍♂️ [NETWORK_TEST] Smart scanning: testing most likely IPs first');

  // Smart scanning: test in batches with different timeouts
  const testBatches = [
    { ips: possibleHosts.slice(0, 4), timeout: 2000, name: "Known IPs" },
    { ips: possibleHosts.slice(4, 24), timeout: 1500, name: "Common ranges" },
    { ips: possibleHosts.slice(24), timeout: 1000, name: "Extended search" }
  ];

  for (const batch of testBatches) {
    console.log(`🎯 [NETWORK_TEST] Testing ${batch.name} (${batch.ips.length} IPs)...`);
    
    for (const host of batch.ips) {
      try {
        const url = `http://${host}:3000/api/items`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), batch.timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ [NETWORK_TEST] Connected to server at ${host}:3000`);
          console.log(`🎉 [NETWORK_TEST] Found in ${batch.name} category`);
          return { 
            success: true, 
            host,
            apiUrl: `http://${host}:3000/api`,
            baseUrl: `http://${host}:3000`,
            category: batch.name
          };
        }
      } catch (error) {
        // Only log errors for known IPs to avoid spam
        if (batch.name === "Known IPs") {
          console.log(`❌ [NETWORK_TEST] ${host}: ${error.message}`);
        }
      }
    }
  }
  
  console.log('🚨 [NETWORK_TEST] No working server found');
  return { 
    success: false, 
    error: 'No server responding on any known IP' 
  };
};

// Cache last working IP for faster reconnection
let lastWorkingIP = null;
let lastTestTime = 0;

// Quick test for app startup with WiFi change detection
export const quickNetworkCheck = async () => {
  try {
    console.log('📡 [NETWORK] Starting WiFi-adaptive connectivity test...');
    
    // Try last working IP first (if recent)
    if (lastWorkingIP && (Date.now() - lastTestTime) < 60000) { // Cache for 1 minute
      try {
        console.log(`🔄 [NETWORK] Trying last known IP: ${lastWorkingIP}`);
        const response = await fetch(`http://${lastWorkingIP}:3000/api/items`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log(`⚡ [NETWORK] Quick reconnect successful!`);
          return {
            success: true,
            host: lastWorkingIP,
            apiUrl: `http://${lastWorkingIP}:3000/api`,
            baseUrl: `http://${lastWorkingIP}:3000`,
            quickReconnect: true
          };
        }
      } catch (error) {
        console.log(`🔄 [NETWORK] Quick reconnect failed, starting full scan...`);
      }
    }
    
    // Full network scan
    const result = await testNetworkConnection();
    
    if (result.success) {
      console.log(`🎉 [NETWORK] Server found at ${result.host} (${result.category})`);
      console.log(`📱 [NETWORK] ✅ WiFi Change Adaptive - works on any network!`);
      
      // Cache the working IP
      lastWorkingIP = result.host;
      lastTestTime = Date.now();
    } else {
      console.log('⚠️  [NETWORK] Server connection issues - check if server is running');
    }
    
    return result;
  } catch (error) {
    console.error('💥 [NETWORK] Test error:', error.message);
    return { success: false, error: error.message };
  }
};

// Force refresh network cache (call this when user changes WiFi)
export const refreshNetworkCache = () => {
  console.log('🔄 [NETWORK] Clearing network cache for WiFi change...');
  lastWorkingIP = null;
  lastTestTime = 0;
};

export default {
  testNetworkConnection,
  quickNetworkCheck,
  refreshNetworkCache
};
