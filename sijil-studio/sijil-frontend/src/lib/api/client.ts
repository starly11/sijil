import { siteConfig } from '@/config/site';
import type { APIResponse } from './types';

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

export async function apiFetchClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  if (!endpoint) {
    throw new Error('API endpoint is required');
  }
  const normalizedBase = siteConfig.apiBaseUrl.replace(/\/$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${normalizedBase}${normalizedEndpoint}`;
  console.log('Calling API:', targetUrl);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(targetUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `API Request Exception [${response.status}]`;
    try {
      const errorJson = await response.json();
      message = errorJson.error || message;
    } catch {
      // Fallback
    }
    throw new APIError(message, response.status);
  }

  return response.json() as Promise<APIResponse<T>>;
}

// Create an api object with methods
export const api = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return apiFetchClient<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  },
  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<APIResponse<T>> {
    return apiFetchClient<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<APIResponse<T>> {
    return apiFetchClient<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },
  async delete<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return apiFetchClient<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },
};
