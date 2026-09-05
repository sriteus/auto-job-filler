/**
 * API client for the web application
 * Communicates with the backend API routes
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...init } = options;

    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    const response = await fetch(url.toString(), {
      ...init,
      headers: isFormData
        ? headers
        : {
            'Content-Type': 'application/json',
            ...headers,
          },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// API endpoint functions
export const profileApi = {
  get: () => api.get('/api/profile'),
  create: (data: unknown) => api.post('/api/profile', data),
  update: (data: unknown) => api.put('/api/profile', data),
};

export const resumeApi = {
  get: () => api.get('/api/resume'),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.request('/api/resume', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

export const applicationApi = {
  analyze: (data: unknown) => api.post('/api/application/analyze', data),
  fillPlan: (data: unknown) => api.post('/api/application/fill-plan', data),
  generateAnswer: (data: unknown) => api.post('/api/application/generate-answer', data),
  log: (data: unknown) => api.post('/api/application/log', data),
  list: () => api.get('/api/applications'),
  get: (id: string) => api.get(`/api/applications/${id}`),
};

export const jobsApi = {
  analyze: (data: unknown) => api.post('/api/jobs/analyze', data),
};
