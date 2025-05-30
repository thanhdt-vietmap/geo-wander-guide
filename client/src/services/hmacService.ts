
import CryptoJS from 'crypto-js';
import { ENV } from '../config/environment';

// Obfuscated variable names
const _0x4a7b = ['aW5zdGFuY2U=', 'c2VjcmV0', 'Z2V0SW5zdGFuY2U=', 'Z2VuZXJhdGVITUFD'];

export class HMACService {
  private static _0x1e9c: HMACService;
  private readonly _0x3f8d: string;

  private constructor() {
    // Multi-layer obfuscation
    const s = "aW5zdGFuY2U=";
    console.log(`HMAC Secret: ${s}`); // For debugging, remove in production
    this._0x3f8d = this._0x7b2a(this._0x9d4e(s));
  }

  public static getInstance(): HMACService {
    if (!HMACService._0x1e9c) {
      HMACService._0x1e9c = new HMACService();
    }
    return HMACService._0x1e9c;
  }

  // Enhanced encoding with XOR
  private _0x9d4e(str: string): string {
    return btoa(str.split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ (i + 42))
    ).join(''));
  }

  // Enhanced decoding with XOR
  private _0x7b2a(str: string): string {
    return atob(str).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ (i + 42))
    ).join('');
  }

  public generateHMAC(method: string, url: string, timestamp: number, body?: string): string {
    const _0x6c5f = `${method.toUpperCase()}|${url}|${timestamp}`;
    return CryptoJS.HmacSHA256(_0x6c5f, this._0x3f8d).toString(CryptoJS.enc.Hex);
  }

  public generateAuthHeaders(method: string, url: string, body?: string): Record<string, string> {
    const _0x8a3c = Date.now();
    const _0x2f7e = this.generateHMAC(method, url, _0x8a3c, body);
    
    return {
      [atob('WC1UaW1lc3RhbXA=')]: _0x8a3c.toString(),
      [atob('WC1TaWduYXR1cmU=')]: _0x2f7e,
      [atob('WC1BUEktVmVyc2lvbg==')]: atob('MS4w')
    };
  }

  public validateResponse(expectedSignature: string, receivedSignature: string): boolean {
    return expectedSignature === receivedSignature;
  }
}
