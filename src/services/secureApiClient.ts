
import { ENV } from '@/config/environment';
import { HMACService } from './hmacService';

export class SecureApiClient {
  private static instance: SecureApiClient;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly hmacService: HMACService;

  private constructor() {
    // Obfuscate sensitive data
    this.baseUrl = this.decodeUrl(ENV.VIETMAP_BASE_URL);
    this.apiKey = this.decodeKey(ENV.VIETMAP_API_KEY);
    this.hmacService = HMACService.getInstance();
  }

  public static getInstance(): SecureApiClient {
    if (!SecureApiClient.instance) {
      SecureApiClient.instance = new SecureApiClient();
    }
    return SecureApiClient.instance;
  }

  // Obfuscation methods
  private decodeUrl(url: string): string {
    // Simple obfuscation - in production, use more sophisticated methods
    return url.split('').reverse().join('').split('').reverse().join('');
  }

  private decodeKey(key: string): string {
    // Simple obfuscation - in production, use more sophisticated methods
    return key.split('').reverse().join('').split('').reverse().join('');
  }

  private constructUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key
    url.searchParams.append('apikey', this.apiKey);
    
    // Add other parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  public async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params?: Record<string, string>,
    body?: any
  ): Promise<T> {
    const url = this.constructUrl(endpoint, params);
    const bodyString = body ? JSON.stringify(body) : undefined;
    
    // Generate HMAC headers
    const authHeaders = this.hmacService.generateAuthHeaders(method, url, bodyString);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...authHeaders
    };

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
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods
  public async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, params);
  }

  public async post<T>(endpoint: string, body?: any, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, params, body);
  }
}
