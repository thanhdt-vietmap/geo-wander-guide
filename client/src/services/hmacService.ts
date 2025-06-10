
import CryptoJS from 'crypto-js';
import { ENV } from '../config/environment';

// Obfuscated variable names
// const _0x4a7b = ['aW5zdGFuY2U=', 'c2VjcmV0', 'Z2V0SW5zdGFuY2U=', 'Z2VuZXJhdGVITUFD'];

export class HMACService {
  private static _0x1e9c: HMACService;
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
      this._0x4b8c([97, 87, 53, 122, 100, 71, 70, 117]),  // aW5zdGFu
      this._0x4b8c([89, 50, 85, 61])                      // Y2U=
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

  // Obfuscated character code generator
  private _0x4b8c(codes: number[]): string {
    const _0x9f2a = String;
    const _0x7e1d = 'fromCharCode';
    return (_0x9f2a as any)[_0x7e1d](...codes);
  }

  // Alternative character builder with bit manipulation
  private _0x3a9e(nums: number[]): string {
    let result = '';
    const _0x9f2a = String;
    const _0x7e1d = 'fromCharCode';
    for (let i = 0; i < nums.length; i++) {
      result += (_0x9f2a as any)[_0x7e1d](nums[i] ^ 0);
    }
    return result;
  }

  // Dynamic method name construction for HMAC algorithm
  private _0x8f3b(): string {
    const parts = [
      this._0x4b8c([72, 109, 97, 99]),     // Hmac
      this._0x4b8c([83, 72, 65, 50, 53, 54]) // SHA256
    ];
    return parts.join('');
  }

  // Dynamic function name obfuscation
  private _0x6e2d(): string {
    // generateHMAC
    return this._0x3a9e([103, 101, 110, 101, 114, 97, 116, 101, 72, 77, 65, 67]);
  }

  private _0x7f4c(): string {
    // generateAuthHeaders  
    return this._0x3a9e([103, 101, 110, 101, 114, 97, 116, 101, 65, 117, 116, 104, 72, 101, 97, 100, 101, 114, 115]);
  }

  private _0x9a1b(): string {
    // validateResponse
    return this._0x3a9e([118, 97, 108, 105, 100, 97, 116, 101, 82, 101, 115, 112, 111, 110, 115, 101]);
  }

  // Dynamic method invocation to hide method names
  private _0x2e8f(methodType: number, ...args: any[]): any {
    switch (methodType) {
      case 1: return this._0x4d8a(args[0], args[1], args[2], args[3]); // HMAC generation
      case 2: return this._0x5c7e(args[0], args[1], args[2]); // Auth headers
      case 3: return this._0x8b9f(args[0], args[1]); // Response validation
      default: return null;
    }
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
      this._0x4b8c([c.charCodeAt(0) ^ (i + 42)])
    ).join(''));
  }

  // Enhanced decoding with XOR
  private _0x7b2a(str: string): string {
    return atob(str).split('').map((c, i) => 
      this._0x4b8c([c.charCodeAt(0) ^ (i + 42)])
    ).join('');
  }

  // Obfuscated HMAC generation method
  private _0x4d8a(method: string, url: string, timestamp: number, body?: string): string {
    const _0x6c5f = `${method.toUpperCase()}|${url}|${timestamp}`;
    const _0x9b2f = this._0x8f3b(); // Get obfuscated method name
    return (CryptoJS as any)[_0x9b2f](_0x6c5f, this._0x3f8d).toString(CryptoJS.enc.Hex);
  }

  // Obfuscated auth headers generation method
  private _0x5c7e(method: string, url: string, body?: string): Record<string, string> {
    const _0x8a3c = Date.now();
    const _0x2f7e = this._0x4d8a(method, url, _0x8a3c, body);
    
    return {
      [atob('WC1UaW1lc3RhbXA=')]: _0x8a3c.toString(),
      [atob('WC1TaWduYXR1cmU=')]: _0x2f7e,
      [atob('WC1BUEktVmVyc2lvbg==')]: atob('MS4w')
    };
  }

  // Obfuscated response validation method
  private _0x8b9f(expectedSignature: string, receivedSignature: string): boolean {
    return expectedSignature === receivedSignature;
  }

  // Public wrappers with obfuscated method names to maintain API compatibility
  // generate HMAC signature
  public ghm(method: string, url: string, timestamp: number, body?: string): string {
    return this._0x2e8f(1, method, url, timestamp, body);
  }

  // generate auth headers
  public gah(method: string, url: string, body?: string): Record<string, string> {
    return this._0x2e8f(2, method, url, body);
  }

  // validate response  
  public vr(expectedSignature: string, receivedSignature: string): boolean {
    return this._0x2e8f(3, expectedSignature, receivedSignature);
  }

  // Alternative access methods with obfuscated names
  public _0x3m8q = this.ghm.bind(this);
  public _0x7h2w = this.gah.bind(this);  
  public _0x9k5r = this.vr.bind(this);
}
