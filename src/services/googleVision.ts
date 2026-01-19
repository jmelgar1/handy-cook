import type { VisionAPIResponse, VisionRequest, ApiResponse } from '../types';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export type AnalyzeImageOptions = {
  maxLabels?: number;
  maxObjects?: number;
  maxLogos?: number;
  includeText?: boolean;
};

const DEFAULT_OPTIONS: AnalyzeImageOptions = {
  maxLabels: 15,
  maxObjects: 10,
  maxLogos: 5,
  includeText: true,
};

export const googleVisionService = {
  /**
   * Analyze an image using Google Cloud Vision API
   * Returns raw Vision API response with all detection types
   */
  analyzeImage: async (
    base64Image: string,
    options: AnalyzeImageOptions = DEFAULT_OPTIONS
  ): Promise<ApiResponse<VisionAPIResponse>> => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'Google Vision API key not configured',
      };
    }

    try {
      // Build features array based on options
      const features: VisionRequest['requests'][0]['features'] = [
        { type: 'LABEL_DETECTION', maxResults: options.maxLabels },
        { type: 'OBJECT_LOCALIZATION', maxResults: options.maxObjects },
        { type: 'LOGO_DETECTION', maxResults: options.maxLogos },
      ];

      if (options.includeText) {
        features.push({ type: 'TEXT_DETECTION' });
      }

      const requestBody: VisionRequest = {
        requests: [
          {
            image: { content: base64Image },
            features,
          },
        ],
      };

      const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `API error: ${response.status}`,
        };
      }

      const data: VisionAPIResponse = await response.json();

      // Check for per-request errors in the response
      if (data.responses?.[0]?.error) {
        return {
          success: false,
          error: data.responses[0].error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image',
      };
    }
  },

  /**
   * Check if the API key is configured
   */
  isConfigured: (): boolean => {
    return !!process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
  },
};
