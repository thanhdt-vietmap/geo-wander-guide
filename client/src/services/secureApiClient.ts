
import { ENV } from '../config/environment';
import { HMACService } from './hmacService';
import {apiClient} from '../api/client';
import { requestCache } from './requestCache';

// Obfuscated class name mapping
const _0x2f8a = {
  a: 'SecureApiClient',
  b: 'baseUrl',
  c: 'apiKey', 
  d: 'hmacService',
  e: 'getInstance',
  f: 'decodeUrl',
  g: 'decodeKey',
  h: 'constructUrl',
  i: 'makeRequest',
  j: 'get',
  k: 'post'
};

export class SecureApiClient {
  private static _0x1f4d: SecureApiClient;
  private readonly _0x3b7e: string;
  private readonly _0x5c9a: string;
  private readonly _0x8d2f: HMACService;
  private userInfoPromise: Promise<any> | null = null;

  private constructor() {
    // Enhanced obfuscation
    this._0x3b7e = this._0x6e1b(ENV.VIETMAP_BASE_URL);
    this._0x5c9a = this._0x4a8c(ENV.LM);
    this._0x8d2f = HMACService.getInstance();
  }

  public static getInstance(): SecureApiClient {
    if (!SecureApiClient._0x1f4d) {
      SecureApiClient._0x1f4d = new SecureApiClient();
    }
    return SecureApiClient._0x1f4d;
  }

  // Multiple layers of obfuscation
  private _0x6e1b(url: string): string {
    const _0x9f2a = String;
    const _0x7e1d = 'fromCharCode';
    const _0x9f2c = url.split('').map((c, i) => 
      (_0x9f2a as any)[_0x7e1d](c.charCodeAt(0) ^ (i % 7))
    ).join('');
    return _0x9f2c.split('').map((c, i) => 
      (_0x9f2a as any)[_0x7e1d](c.charCodeAt(0) ^ (i % 7))
    ).join('');
  }

  private _0x4a8c(key: string): string {
    const _0x7b5d = key.split('').reverse().join('');
    return _0x7b5d.split('').reverse().join('');
  }

  private _0x2d8f(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this._0x3b7e}${endpoint}`);
    
    // Add API key with obfuscated parameter name
    url.searchParams.append(atob('YXBpa2V5'), this._0x5c9a);
    
    // Add other parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }
  private isDesktop() {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

    const isMobile = /android|iphone|ipad|ipod|windows phone|mobile/i.test(ua);

    return !isMobile;
  }

  public async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params?: Record<string, string>,
    body?: any
  ): Promise<T> {
    const url = this._0x2d8f(endpoint, params);
    const bodyString = body ? JSON.stringify(body) : undefined;
    
    // Generate HMAC headers
    const authHeaders = this._0x8d2f.gah(method, 'maps.vietmap.vn', bodyString);
    
    const headers: HeadersInit = {
      [atob('Q29udGVudC1UeXBl')]: atob('YXBwbGljYXRpb24vanNvbg=='),
      ...authHeaders
    };
    // Delayed 1.5 seconds before making the request
    // await new Promise(resolve => setTimeout(resolve, 500));
    // // Anti-debugging check

    // if (this.isDesktop()&&( window.outerHeight - window.innerHeight > 160 ||
    //     window.outerWidth - window.innerWidth > 160)) {
    //   return Promise.reject();
    // }
    this.getUserInfo();
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods with obfuscated names internally
  public async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Create unique cache key for GET requests
    const cacheKey = `GET:${endpoint}:${JSON.stringify(params || {})}`;
    
    return requestCache.getOrFetch(cacheKey, () => 
      this.makeApiClientRequest<T>('GET', endpoint, params)
    );
  }

  public async post<T>(endpoint: string, body?: any, params?: Record<string, string>): Promise<T> {
    // Don't cache POST requests, just make the call
    return this.makeApiClientRequest<T>('POST', endpoint, params, body);
  }
  public getUserInfo = () => {
    // Return existing promise if already fetching
    if (this.userInfoPromise) {
      return this.userInfoPromise;
    }

    this.userInfoPromise = apiClient.get('/users')
      .then(response => {
        // Reset promise after completion
        this.userInfoPromise = null;
        return response;
      })
      .catch(error => {
        // Reset promise on error too
        this.userInfoPromise = null;
        console.error('Error fetching user info:', error);
        throw error;
      });

    return this.userInfoPromise;
  }

  // Make request using apiClient

  public async makeApiClientRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params?: Record<string, string>,
    body?: any
  ): Promise<T> {
    // await new Promise(resolve => setTimeout(resolve, 500));
    // Anti-debugging check
    
    // if (this.isDesktop()&&( window.outerHeight - window.innerHeight > 160 ||
    //     window.outerWidth - window.innerWidth > 160)) {
    //   return Promise.reject();
    // }
    // const url = this._0x2d8f(endpoint, params);
    const bodyString = body ? JSON.stringify(body) : undefined;

    // Generate HMAC headers
    const authHeaders = this._0x8d2f.gah(method, 'maps.vietmap.vn', bodyString);

    const headers: HeadersInit = {
      [atob('Q29udGVudC1UeXBl')]: atob('YXBwbGljYXRpb24vanNvbg=='),
      ...authHeaders
    };

    try {
      return await apiClient.makeRequest<T>(method, endpoint, params,headers, bodyString);
    } catch (error) {
      // console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }
}
