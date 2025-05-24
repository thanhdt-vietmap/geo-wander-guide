
import CryptoJS from 'crypto-js';
import { ENV } from '@/config/environment';

export class HMACService {
  private static instance: HMACService;
  private readonly secret: string;

  private constructor() {
    // Obfuscate the secret key retrieval
    const s = ENV.HMAC_SECRET;
    this.secret = this.d(this.e(s));
  }

  public static getInstance(): HMACService {
    if (!HMACService.instance) {
      HMACService.instance = new HMACService();
    }
    return HMACService.instance;
  }

  // Simple encoding to obfuscate
  private e(str: string): string {
    return btoa(str);
  }

  // Simple decoding
  private d(str: string): string {
    return atob(str);
  }

  public generateHMAC(method: string, url: string, timestamp: number, body?: string): string {
    const message = `${method.toUpperCase()}|${url}|${timestamp}${body ? `|${body}` : ''}`;
    return CryptoJS.HmacSHA256(message, this.secret).toString(CryptoJS.enc.Hex);
  }

  public generateAuthHeaders(method: string, url: string, body?: string): Record<string, string> {
    const timestamp = Date.now();
    const hmac = this.generateHMAC(method, url, timestamp, body);
    
    return {
      'X-Timestamp': timestamp.toString(),
      'X-Signature': hmac,
      'X-API-Version': '1.0'
    };
  }

  public validateResponse(expectedSignature: string, receivedSignature: string): boolean {
    return expectedSignature === receivedSignature;
  }
}
