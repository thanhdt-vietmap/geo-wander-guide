export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}