import { siteConfig } from '@/config/site';

export class HTTPError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HTTPError';
  }
}

export async function httpClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${siteConfig.apiBaseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorMessage = `HTTP Exception encountered: ${response.statusText}`;
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      // Fallback if parsing json fails
    }
    throw new HTTPError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}
