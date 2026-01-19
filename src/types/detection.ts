// Detection source types - which Vision API feature detected the item
export type DetectionSource = 'logo' | 'ocr' | 'label' | 'object';

// Raw detection from Google Vision API
export type RawDetection = {
  label: string;
  confidence: number;
  source: DetectionSource;
  boundingBox?: BoundingBox;
  isPending?: boolean; // True if classification is unknown/pending backend verification
  category?: string; // Food category if known
};

// Bounding box from object localization
export type BoundingBox = {
  vertices: Array<{ x: number; y: number }>;
  normalizedVertices: Array<{ x: number; y: number }>;
};

// Processed detected item (after deduplication/accumulation)
export type DetectedItem = {
  id: string;
  label: string;
  confidence: number;
  source: DetectionSource;
  count: number; // How many times detected across frames
  firstSeenAt: number;
  lastSeenAt: number;
  boundingBox?: BoundingBox;
  isPending?: boolean; // True if classification is unknown/pending backend verification
  category?: string; // Food category if known
};

// Detection session state
export type DetectionState = {
  isScanning: boolean;
  detectedItems: DetectedItem[];
  pendingRequests: number;
  sessionStartTime: number | null;
  error: string | null;
};

// Google Vision API response types
export type VisionAPIResponse = {
  responses: Array<{
    labelAnnotations?: VisionLabel[];
    localizedObjectAnnotations?: VisionObject[];
    logoAnnotations?: VisionLogo[];
    textAnnotations?: VisionText[];
    error?: { code: number; message: string };
  }>;
};

export type VisionLabel = {
  mid: string;
  description: string;
  score: number;
  topicality: number;
};

export type VisionObject = {
  mid: string;
  name: string;
  score: number;
  boundingPoly: BoundingBox;
};

export type VisionLogo = {
  mid: string;
  description: string;
  score: number;
  boundingPoly?: BoundingBox;
};

export type VisionText = {
  locale?: string;
  description: string;
  boundingPoly?: BoundingBox;
};

// Vision API request types
export type VisionFeatureType =
  | 'LABEL_DETECTION'
  | 'OBJECT_LOCALIZATION'
  | 'LOGO_DETECTION'
  | 'TEXT_DETECTION';

export type VisionRequest = {
  requests: Array<{
    image: { content: string };
    features: Array<{
      type: VisionFeatureType;
      maxResults?: number;
    }>;
  }>;
};
