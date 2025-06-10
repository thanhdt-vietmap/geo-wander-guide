
// Obfuscated environment configuration
const _0x1a2b = ['aHR0cHM6Ly9tYXBzLnZpZXRtYXAudm4vYXBp', 'NTA2ODYyYmIwM2EzZDcxNjMyYmRlYjc2NzRhMzYyNTMyOGNiN2U1YTliMDExODQx', 'eW91ci1obWFjLXNlY3JldC1rZXk=', 'MjEuMDI4NSwxMDUuODM0Mg=='];

function _0x4f5a(index: number): string {
  try {
    const decoded = atob(_0x1a2b[index]);
    // console.log(`Decoded index ${index}:`, decoded);
    return decoded;
  } catch (error) {
    // console.error(`Failed to decode index ${index}:`, error);
    return '';
  }
}

// Runtime environment detection
const _0x9c8e = (): boolean => {
  const isProduction = typeof window !== 'undefined' && 
         window.location.hostname !== 'localhost' && 
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('.local');
  
  // console.log('Environment detection:', {
  //   hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  //   isProduction
  // });
  
  return isProduction;
};

// Obfuscated config getter
const _0x7d3c = (key: string, fallback: string, index: number): string => {
  const isProduction = _0x9c8e();
  let value;
  
  if (isProduction) {
    value = _0x4f5a(index);
    // console.log(`Production mode - using obfuscated value for ${key}:`, value ? 'Found' : 'Empty');
  } else {
    // Use globalThis to access Vite environment variables
    const viteEnv = (globalThis as any).import?.meta?.env || {};
    value = viteEnv[key] || fallback;
    // console.log(`Development mode - using env var ${key}:`, value ? 'Found' : 'Using fallback');
  }
  
  return value;
};

// Dynamic fallback generator to avoid static strings
const _0x8f1d = (): string => {
  // Obfuscated character generator
  const _0x9f2a = String;
  const _0x7e1d = 'fromCharCode';
  
  // Construct the fallback key dynamically
  const parts = [
    (_0x9f2a as any)[_0x7e1d](97, 87, 53, 122),      // aW5z
    (_0x9f2a as any)[_0x7e1d](100, 71, 70, 117),     // dGFu
    (_0x9f2a as any)[_0x7e1d](89, 50, 85, 61)        // Y2U=
  ];
  return parts.join('');
};

export const ENV = {
  LM: _0x7d3c('LM', '95f852d9f8c38e08ceacfd456b59059d0618254a50d3854c', 1),
  VIETMAP_BASE_URL: _0x7d3c('VIETMAP_BASE_URL', 'https://maps.vietmap.vn/api', 0),
  FOCUS_COORDINATES: _0x7d3c('FOCUS_COORDINATES', '21.0285,105.8342', 3)
};


// Add runtime protection
if (_0x9c8e()) {
  // Clear environment variables in production
  try {
    const viteEnv = (globalThis as any).import?.meta?.env;
    if (viteEnv) {
      Object.keys(viteEnv).forEach(key => {
        if (key.startsWith('VITE_')) {
          try {
            delete viteEnv[key];
          } catch {}
        }
      });
    }
  } catch {}
}
