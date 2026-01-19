import { useAuthStore } from '../store/authStore';
import type { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.handycook.app';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return {};
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    try {
      const authHeaders = skipAuth ? {} : await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Recipe endpoints
export const recipeApi = {
  list: (params?: { cuisine?: string; limit?: number; nextToken?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.cuisine) queryParams.set('cuisine', params.cuisine);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.nextToken) queryParams.set('nextToken', params.nextToken);
    const query = queryParams.toString();
    return api.get<PaginatedResponse<unknown>>(`/recipes${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api.get(`/recipes/${id}`),
  create: (recipe: unknown) => api.post('/recipes', recipe),
  update: (id: string, recipe: unknown) => api.put(`/recipes/${id}`, recipe),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  import: (url: string) => api.post('/recipes/import', { url }),
};

// Pantry endpoints
export const pantryApi = {
  list: () => api.get('/pantry'),
  add: (item: unknown) => api.post('/pantry', item),
  update: (id: string, item: unknown) => api.put(`/pantry/${id}`, item),
  delete: (id: string) => api.delete(`/pantry/${id}`),
};

// Scan endpoints
export const scanApi = {
  barcode: (barcode: string) => api.post('/scan/barcode', { barcode }),
  image: (imageBase64: string) => api.post('/scan/image', { image: imageBase64 }),
};

// User endpoints
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profile: unknown) => api.put('/user/profile', profile),
  getProgress: () => api.get('/user/progress'),
};

// Classification API (separate Lambda endpoint)
const CLASSIFICATION_API_URL =
  process.env.EXPO_PUBLIC_CLASSIFICATION_API_URL ||
  'https://yw5sawdijk.execute-api.us-east-1.amazonaws.com/default';

export type USDAMetadata = {
  fdcId: number;
  description: string;
  dataType: 'Foundation' | 'SR Legacy';
  foodCategory: string;
};

export type ClassificationResult = {
  isFood: boolean;
  category: string | null;
  source: 'usda' | 'usda_no_match' | 'cached' | 'usda_error';
  confidence: number;
  usda?: USDAMetadata | null;
};

export type WordListResponse = {
  foodWords: Record<string, string[]>;
  nonFoodWords: string[];
  genericWords: string[];
  version: string;
};

export type ClassifyWordsResponse = {
  classifications: Record<string, ClassificationResult>;
};

export const classificationApi = {
  /**
   * Get all word lists for local caching
   * GET /words
   */
  getWordsList: async (): Promise<WordListResponse> => {
    const response = await fetch(`${CLASSIFICATION_API_URL}/words`);
    if (!response.ok) {
      throw new Error(`Failed to fetch word lists: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Classify unknown words using USDA Foundation foods
   * POST /classify
   */
  classifyWords: async (
    words: string[]
  ): Promise<Record<string, ClassificationResult>> => {
    const response = await fetch(`${CLASSIFICATION_API_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words }),
    });
    if (!response.ok) {
      throw new Error(`Failed to classify words: ${response.status}`);
    }
    const data: ClassifyWordsResponse = await response.json();
    return data.classifications;
  },

  /**
   * Send feedback on classification accuracy
   * POST /feedback
   */
  sendFeedback: async (word: string, accepted: boolean): Promise<void> => {
    const response = await fetch(`${CLASSIFICATION_API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, accepted }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send feedback: ${response.status}`);
    }
  },
};

// OCR Correction API Types
export type FoodTerm = {
  term: string;
  confidence: number;
  category: string;
};

export type CorrectOCRRequest = {
  ocrText: string;
  logoTexts?: string[];
};

export type CorrectOCRResponse = {
  foodTerms: FoodTerm[];
  brandName: string | null;
  productName: string | null;
  cached: boolean;
  source: 'llm' | 'cache' | 'fallback';
  processingTime: number;
};

export const correctionApi = {
  /**
   * Correct OCR text using Claude Haiku LLM
   * POST /correct-ocr
   */
  correctOCR: async (input: CorrectOCRRequest): Promise<CorrectOCRResponse> => {
    const response = await fetch(`${CLASSIFICATION_API_URL}/correct-ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`Failed to correct OCR: ${response.status}`);
    }
    return response.json();
  },
};
