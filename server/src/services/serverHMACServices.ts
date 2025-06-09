
import CryptoJS from 'crypto-js';
// import { ENV } from '../config/environment';

// Obfuscated variable names
const _0x4a7b = ['aW5zdGFuY2U=', 'c2VjcmV0', 'Z2V0SW5zdGFuY2U=', 'Z2VuZXJhdGVITUFD'];

export class ServerHMACService {
  private static _0x1e9c: ServerHMACService;
  private readonly _0x3f8d: string;

  private constructor() {
    // Runtime string construction to avoid static strings in build
    const secretKey =  this._0x2c8f();
    this._0x3f8d = this._0x7b2a(this._0x9d4e(secretKey));
    
    // Runtime cleanup to remove traces
    setTimeout(() => this._0x5a7e(), 100);
  }

  // Fallback key generator - constructs the key dynamically
  private _0x2c8f(): string {
    const chunks = [
      String.fromCharCode(97, 87, 53, 122, 100, 71, 70, 117),  // aW5zdGFu
      String.fromCharCode(89, 50, 85, 61)                      // Y2U=
    ];
    return chunks.join('');
  }

  // Runtime cleanup method
  private _0x5a7e(): void {
    // Clear any potential traces in memory
    try {
      if ((globalThis as any).ENV) {
        delete (globalThis as any).ENV;
      }
    } catch {}
  }

  public static getInstance(): ServerHMACService {
    if (!ServerHMACService._0x1e9c) {
      ServerHMACService._0x1e9c = new ServerHMACService();
    }
    return ServerHMACService._0x1e9c;
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


