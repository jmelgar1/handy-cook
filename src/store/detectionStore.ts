import { create } from 'zustand';
import type { DetectedItem, RawDetection } from '../types';

type DetectionState = {
  isScanning: boolean;
  detectedItems: DetectedItem[];
  pendingRequests: number;
  sessionStartTime: number | null;
  error: string | null;
  showSummary: boolean;
  isFinalizingResults: boolean;
};

type ClassificationResult = {
  isFood: boolean;
  category: string | null;
};

type DetectionActions = {
  startScanning: () => void;
  stopScanning: () => void;
  addDetection: (detection: RawDetection) => void;
  addDetections: (detections: RawDetection[]) => void;
  updateItem: (id: string, updates: Partial<DetectedItem>) => void;
  removeItem: (id: string) => void;
  clearSession: () => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setError: (error: string | null) => void;
  setShowSummary: (show: boolean) => void;
  setIsFinalizingResults: (isFinalizing: boolean) => void;
  showSummaryModal: () => void;
  getUniqueItems: () => DetectedItem[];
  resolvePendingDetections: (
    classifications: Record<string, ClassificationResult>
  ) => void;
  getPendingItems: () => DetectedItem[];
};

const initialState: DetectionState = {
  isScanning: false,
  detectedItems: [],
  pendingRequests: 0,
  sessionStartTime: null,
  error: null,
  showSummary: false,
  isFinalizingResults: false,
};

// Generate a simple unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Check if two labels are similar (for deduplication)
const isSimilarLabel = (label1: string, label2: string): boolean => {
  const normalize = (s: string) => s.toLowerCase().trim();
  return normalize(label1) === normalize(label2);
};

export const useDetectionStore = create<DetectionState & DetectionActions>()((set, get) => ({
  ...initialState,

  startScanning: () =>
    set({
      isScanning: true,
      sessionStartTime: Date.now(),
      error: null,
      detectedItems: [],
      showSummary: false,
    }),

  stopScanning: () =>
    set({
      isScanning: false,
      // Don't show summary yet - wait for finalization
    }),

  addDetection: (detection: RawDetection) => {
    const { detectedItems } = get();
    const now = Date.now();

    // Check if similar item already exists
    const existingIndex = detectedItems.findIndex((item) =>
      isSimilarLabel(item.label, detection.label)
    );

    if (existingIndex >= 0) {
      // Update existing item
      const existing = detectedItems[existingIndex];
      const updatedItems = [...detectedItems];
      updatedItems[existingIndex] = {
        ...existing,
        confidence: Math.max(existing.confidence, detection.confidence),
        count: existing.count + 1,
        lastSeenAt: now,
        // Keep the better bounding box (if new one exists)
        boundingBox: detection.boundingBox || existing.boundingBox,
        // Preserve pending status - if already resolved, keep it; otherwise use new detection's status
        isPending: existing.isPending === false ? false : detection.isPending,
        // Update category if provided
        category: detection.category || existing.category,
      };
      set({ detectedItems: updatedItems });
    } else {
      // Add new item
      const newItem: DetectedItem = {
        id: generateId(),
        label: detection.label,
        confidence: detection.confidence,
        source: detection.source,
        count: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        boundingBox: detection.boundingBox,
        isPending: detection.isPending,
        category: detection.category,
      };
      set({ detectedItems: [...detectedItems, newItem] });
    }
  },

  addDetections: (detections: RawDetection[]) => {
    detections.forEach((detection) => {
      get().addDetection(detection);
    });
  },

  updateItem: (id, updates) =>
    set((state) => ({
      detectedItems: state.detectedItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      detectedItems: state.detectedItems.filter((item) => item.id !== id),
    })),

  clearSession: () => set(initialState),

  incrementPending: () =>
    set((state) => ({ pendingRequests: state.pendingRequests + 1 })),

  decrementPending: () =>
    set((state) => ({ pendingRequests: Math.max(0, state.pendingRequests - 1) })),

  setError: (error) => set({ error }),

  setShowSummary: (show) => set({ showSummary: show }),

  setIsFinalizingResults: (isFinalizing) => set({ isFinalizingResults: isFinalizing }),

  showSummaryModal: () => set({ showSummary: true, isFinalizingResults: false }),

  getUniqueItems: () => {
    const { detectedItems } = get();
    // Sort by confidence (highest first), then by count
    return [...detectedItems].sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.count - a.count;
    });
  },

  resolvePendingDetections: (classifications) =>
    set((state) => ({
      detectedItems: state.detectedItems
        .map((item) => {
          // Skip items that aren't pending
          if (!item.isPending) return item;

          const normalizedLabel = item.label.toLowerCase().trim();
          const result = classifications[normalizedLabel];

          // No classification result yet - keep as pending
          if (!result) return item;

          // If classified as food, keep the item and mark as resolved
          if (result.isFood) {
            return {
              ...item,
              isPending: false,
              category: result.category || item.category,
            };
          }

          // Classified as non-food - mark for removal
          return null;
        })
        .filter((item): item is DetectedItem => item !== null),
    })),

  getPendingItems: () => {
    const { detectedItems } = get();
    return detectedItems.filter((item) => item.isPending === true);
  },
}));
