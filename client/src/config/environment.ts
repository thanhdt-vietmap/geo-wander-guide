
// Obfuscated environment configuration
const _0x1a2b = ['aHR0cHM6Ly9tYXBzLnZpZXRtYXAudm4vYXBp', 'NTA2ODYyYmIwM2EzZDcxNjMyYmRlYjc2NzRhMzYyNTMyOGNiN2U1YTliMDExODQx', 'eW91ci1obWFjLXNlY3JldC1rZXk=', 'MjEuMDI4NSwxMDUuODM0Mg=='];

function _0x4f5a(index: number): string {
  try {
    const decoded = atob(_0x1a2b[index]);
    console.log(`Decoded index ${index}:`, decoded);
    return decoded;
  } catch (error) {
    console.error(`Failed to decode index ${index}:`, error);
    return '';
  }
}

// Runtime environment detection
const _0x9c8e = (): boolean => {
  const isProduction = typeof window !== 'undefined' && 
         window.location.hostname !== 'localhost' && 
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('.local');
  
  console.log('Environment detection:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    isProduction
  });
  
  return isProduction;
};

// Obfuscated config getter
const _0x7d3c = (key: string, fallback: string, index: number): string => {
  const isProduction = _0x9c8e();
  let value;
  
  if (isProduction) {
    value = _0x4f5a(index);
    console.log(`Production mode - using obfuscated value for ${key}:`, value ? 'Found' : 'Empty');
  } else {
    value = import.meta.env[key] || fallback;
    console.log(`Development mode - using env var ${key}:`, value ? 'Found' : 'Using fallback');
  }
  
  return value;
};

export const ENV = {
  VIETMAP_API_KEY: _0x7d3c('VITE_VIETMAP_API_KEY', '506862bb03a3d71632bdeb7674a3625328cb7e5a9b011841', 1),
  VIETMAP_BASE_URL: _0x7d3c('VITE_VIETMAP_BASE_URL', 'https://maps.vietmap.vn/api', 0),
  HMAC_SECRET: _0x7d3c('VITE_HMAC_SECRET', 'your-hmac-secret-key', 2),
  FOCUS_COORDINATES: _0x7d3c('VITE_FOCUS_COORDINATES', '21.0285,105.8342', 3)
};

console.log('Final ENV configuration:', {
  VIETMAP_API_KEY: ENV.VIETMAP_API_KEY ? 'Present' : 'Missing',
  VIETMAP_BASE_URL: ENV.VIETMAP_BASE_URL ? 'Present' : 'Missing',
  HMAC_SECRET: ENV.HMAC_SECRET ? 'Present' : 'Missing',
  FOCUS_COORDINATES: ENV.FOCUS_COORDINATES ? 'Present' : 'Missing'
});

// Add runtime protection
if (_0x9c8e()) {
  // Clear environment variables
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      try {
        delete (import.meta.env as any)[key];
      } catch {}
    }
  });
}
