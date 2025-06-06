
import { apiService } from './apiService';

export class ApiConfig {
  static enableProxyMode(proxyBaseUrl: string = '') {
    // console.log('Switching to proxy mode with base URL:', proxyBaseUrl);
    apiService.setProxyMode(true, proxyBaseUrl);
  }

  static enableDirectMode() {
    // console.log('Switching to direct mode');
    apiService.setProxyMode(false);
  }

  static getCurrentMode(): 'proxy' | 'direct' {
    return (apiService as any).config.useProxy ? 'proxy' : 'direct';
  }
}

// Example usage:
// ApiConfig.enableProxyMode('/api'); // Switch to proxy mode
// ApiConfig.enableDirectMode(); // Switch back to direct mode
