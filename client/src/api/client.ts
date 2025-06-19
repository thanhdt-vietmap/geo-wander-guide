// Check if running in Docker (frontend container) or locally
const isInDocker = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isInDocker 
  ? (import.meta.env.VITE_API_URL || 'http://server:5005') // Direct connection to server in Docker
  : 'http://localhost:5005'; // Local development

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  // method, endpoint, params, body
  async makeRequest<T>(method: string, endpoint: string, 
    params?: Record<string, string>,
    headers?: Record<string, string>,
    body?: any ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    const bodyString = body ? JSON.stringify(body) : undefined;

    const response = await fetch(url.toString(), {
      method,
      headers: headers || {
        'Content-Type': 'application/json',
      },
      body: bodyString,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};