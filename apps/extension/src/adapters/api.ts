/**
 * API Adapter for Chrome Extension
 * Communicates with the backend API
 */

const API_BASE = 'http://localhost:3000';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ExtensionAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  // Profile API
  async getProfile(profileId: string) {
    return this.get(`/api/profile/${profileId}`);
  }

  // Application API
  async analyzeApplication(data: {
    fields: unknown[];
    jobInfo: unknown;
    profileId: string;
  }) {
    return this.post('/api/application/analyze', data);
  }

  async getFillPlan(data: {
    fields: unknown[];
    jobInfo: unknown;
    profileId: string;
  }) {
    return this.post('/api/application/fill-plan', data);
  }

  async generateAnswer(data: {
    question: string;
    jobInfo: unknown;
    profile: unknown;
    classification: string;
  }) {
    return this.post('/api/application/generate-answer', data);
  }

  async logApplication(data: unknown) {
    return this.post('/api/application/log', data);
  }
}

export const apiClient = new ExtensionAPIClient();