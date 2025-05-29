
import { SecureApiClient } from './secureApiClient';

export type ApiConfig = {
  useProxy?: boolean;
  proxyBaseUrl?: string;
};

export class ApiService {
  private secureClient: SecureApiClient;
  private config: ApiConfig;

  constructor(config: ApiConfig = {}) {
    this.secureClient = SecureApiClient.getInstance();
    this.config = {
      useProxy: false,
      proxyBaseUrl: '/proxy',
      ...config
    };
  }

  async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params?: Record<string, string>,
    body?: any
  ): Promise<T> {
    if (this.config.useProxy) {
      return this.proxyRequest<T>(method, endpoint, params, body);
    } else {
      return this.secureClient.makeApiClientRequest<T>(method, endpoint, params, body);
    }
  }

  private async proxyRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    params?: Record<string, string>,
    body?: any
  ): Promise<T> {
    const proxyUrl = `${this.config.proxyBaseUrl}/proxy`;
    
    const requestBody = {
      method,
      endpoint,
      params,
      body
    };

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, params);
  }

  async post<T>(endpoint: string, body?: any, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, params, body);
  }

  async put<T>(endpoint: string, body?: any, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, params, body);
  }

  async delete<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint, params);
  }

  // Method to switch between direct and proxy mode
  setProxyMode(useProxy: boolean, proxyBaseUrl?: string) {
    this.config.useProxy = useProxy;
    if (proxyBaseUrl) {
      this.config.proxyBaseUrl = proxyBaseUrl;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
