# Dynamic API Configuration - WardrobeNearby

## 🚀 Overview

The WardrobeNearby app now uses a **dynamic API configuration system** that automatically detects the correct server IP address, eliminating the need for manual updates when your network changes.

## ✨ Features

- **Auto-Detection**: Automatically finds the correct server IP from multiple sources
- **Smart Caching**: Caches working IPs for 30 seconds to improve performance  
- **Auto-Retry**: Automatically retries with fresh IP detection if connection fails
- **Fallback System**: Multiple fallback strategies ensure connection reliability
- **Zero Configuration**: Works out-of-the-box without manual IP updates

## 🛠️ How It Works

### 1. IP Detection Sources (in priority order):
1. **Environment Variable** (`.env.local` EXPO_PUBLIC_API_HOST)
2. **Expo Auto-Detection** (from debugger host)
3. **Common IP Ranges** (previously used IPs, common router ranges)

### 2. Connection Testing:
- Tests each possible IP with a 3-second timeout
- Returns first working connection
- Caches successful IP for performance

### 3. Error Handling:
- Automatically refreshes IP cache on connection failure
- Retries once with fresh IP detection
- Provides detailed error messages and solutions

## 📁 File Structure

```
config/
├── dynamicApiConfig.js     # Core dynamic IP detection logic
├── connectivityTest.js     # Network testing utilities  
└── apiConfig.js           # Legacy static config (still supported)

utils/
└── api.js                 # Enhanced API utility with auto-retry

context/
└── ChatContext.js         # WebSocket with dynamic IP detection
```

## 🔧 Current Configuration

**Server**: Running on `http://192.168.10.48:3000`  
**API Endpoint**: `http://192.168.10.48:3000/api`  
**WebSocket**: `http://192.168.10.48:3000`

## 📱 Usage

### Automatic (Recommended)
The system works automatically! No manual configuration needed.

### Manual Testing
```javascript
import { quickConnectivityCheck } from './config/connectivityTest';

// Test connectivity
const result = await quickConnectivityCheck();
console.log('Connection status:', result.success);
```

### Force IP Refresh
```javascript
import { refreshIPCache } from './config/dynamicApiConfig';

// Force refresh IP cache
refreshIPCache();
```

## 🔍 Debugging

### View Current Configuration
```javascript
import { getConfigInfo } from './config/dynamicApiConfig';

const info = getConfigInfo();
console.log('Possible IPs:', info.possibleIPs);
console.log('Current Cached IP:', info.currentCachedIP);
```

### Check Server Status
```bash
# Check if server is running
lsof -ti:3000

# Check current network IP
ifconfig | grep "inet " | grep -v "127.0.0.1"

# Test API manually  
curl http://192.168.10.48:3000/api/items
```

## 🚨 Troubleshooting

### Connection Errors
1. **Check Server**: Ensure `node index.js` is running in `WardrobeNearby-Server/`
2. **Network Change**: Restart React Native app to pick up new IP
3. **Manual Override**: Update `EXPO_PUBLIC_API_HOST` in `.env.local` if needed

### WebSocket Issues  
- WebSocket automatically uses same IP as API
- Connection errors trigger IP cache refresh
- Check server logs for WebSocket status

## 🎯 Benefits

- ✅ **No More Manual IP Updates**: System adapts automatically
- ✅ **Better Reliability**: Multiple fallback strategies  
- ✅ **Faster Development**: Less time spent on network configuration
- ✅ **Error Recovery**: Automatic retry on connection failure
- ✅ **Performance**: Smart caching reduces connection tests

## 🔄 Migration Guide

### From Static Configuration:
No migration needed! The dynamic system is backward compatible with existing `.env.local` files.

### Manual Testing:
```javascript
// Old way (static)
const API_URL = 'http://192.168.10.48:3000/api';

// New way (dynamic)  
const API_URL = await getDynamicApiUrl();
```

## 📝 Next Steps

1. **Test the app** - Restart React Native app to use new dynamic config
2. **Change networks** - System should adapt automatically  
3. **Check logs** - Monitor console for connectivity status
4. **Enjoy** - No more manual IP configuration! 🎉

---

**Last Updated**: Current Network IP `192.168.10.48`  
**Status**: ✅ Dynamic API Configuration Active
