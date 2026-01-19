import { useRef, useCallback, useEffect } from 'react';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useDetectionStore } from '@/store/detectionStore';
import { googleVisionService } from '@/services/googleVision';
import { parseVisionResponse, getAndClearUnknownWords } from '@/services/visionResponseParser';
import { foodClassificationService } from '@/services/foodClassificationService';

// Configuration
const SCAN_INTERVAL_MS = 2500; // Capture frame every 2.5 seconds
const MAX_SCAN_DURATION_MS = 60000; // Max 60 seconds of scanning
const IMAGE_QUALITY = 0.5; // Compress images to reduce API costs
const FINALIZATION_TIMEOUT_MS = 10000; // 10 second max wait for classification

export function useFoodScanner() {
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isScanning,
    detectedItems,
    pendingRequests,
    sessionStartTime,
    error,
    showSummary,
    isFinalizingResults,
    startScanning: storeStartScanning,
    stopScanning: storeStopScanning,
    addDetections,
    incrementPending,
    decrementPending,
    setError,
    clearSession,
    setShowSummary,
    setIsFinalizingResults,
    showSummaryModal,
    getUniqueItems,
    resolvePendingDetections,
    getPendingItems,
  } = useDetectionStore();

  // Buffer to accumulate unknown words for batch classification
  const unknownWordsBuffer = useRef<string[]>([]);

  // Process accumulated unknown words by classifying them via backend
  const processUnknownWords = useCallback(async () => {
    const words = [...new Set(unknownWordsBuffer.current)];
    unknownWordsBuffer.current = [];

    if (words.length === 0) return;

    try {
      console.log(`[Scanner] Classifying ${words.length} unknown words:`, words);
      const classifications = await foodClassificationService.classifyUnknownWords(words);

      // Convert to the format expected by resolvePendingDetections
      const resolvedClassifications: Record<string, { isFood: boolean; category: string | null }> = {};
      for (const [word, result] of Object.entries(classifications)) {
        resolvedClassifications[word] = {
          isFood: result.isFood,
          category: result.category,
        };
      }

      // Update pending items in the store
      if (Object.keys(resolvedClassifications).length > 0) {
        resolvePendingDetections(resolvedClassifications);
        console.log('[Scanner] Resolved pending detections');
      }
    } catch (err) {
      console.error('[Scanner] Failed to classify unknown words:', err);
    }
  }, [resolvePendingDetections]);

  // Capture and analyze a single frame
  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current) {
      console.warn('Camera ref not available');
      return;
    }

    try {
      // Capture frame with base64
      const photo = await cameraRef.current.takePictureAsync({
        quality: IMAGE_QUALITY,
        base64: true,
        skipProcessing: true, // Skip processing for faster capture
      });

      if (!photo?.base64) {
        console.warn('Failed to capture frame with base64');
        return;
      }

      incrementPending();

      // Send to Google Vision API (non-blocking)
      const result = await googleVisionService.analyzeImage(photo.base64);

      if (result.success && result.data) {
        const detections = await parseVisionResponse(result.data);
        if (detections.length > 0) {
          addDetections(detections);
          // Haptic feedback for new detections
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Collect unknown words from this frame
        const unknowns = getAndClearUnknownWords();
        if (unknowns.length > 0) {
          unknownWordsBuffer.current.push(...unknowns);
          console.log(`[Scanner] Collected ${unknowns.length} unknown words`);

          // Batch-classify when we have accumulated enough words (5+) or periodically
          if (unknownWordsBuffer.current.length >= 5) {
            processUnknownWords();
          }
        }
      } else if (result.error) {
        console.error('Vision API error:', result.error);
        // Don't set error state for individual frame failures
      }
    } catch (err) {
      console.error('Frame capture error:', err);
    } finally {
      decrementPending();
    }
  }, [addDetections, incrementPending, decrementPending, processUnknownWords]);

  // Start scanning
  const startScanning = useCallback(() => {
    if (isScanning) return;

    // Check if API is configured
    if (!googleVisionService.isConfigured()) {
      setError('Google Vision API key not configured');
      return;
    }

    storeStartScanning();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start periodic frame capture
    intervalRef.current = setInterval(captureAndAnalyze, SCAN_INTERVAL_MS);

    // Capture first frame immediately
    captureAndAnalyze();

    // Set max duration timeout
    maxDurationTimeoutRef.current = setTimeout(() => {
      stopScanning();
    }, MAX_SCAN_DURATION_MS);
  }, [isScanning, captureAndAnalyze, storeStartScanning, setError]);

  // Stop scanning with proper async finalization
  const stopScanning = useCallback(async () => {
    if (!isScanning) return;

    // Clear intervals and timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Stop scanning state (but don't show modal yet)
    storeStopScanning();

    // Check if we have unknown words to process
    const hasUnknownWords = unknownWordsBuffer.current.length > 0;

    if (hasUnknownWords) {
      // Show finalizing overlay
      setIsFinalizingResults(true);

      try {
        // Process with timeout protection
        await Promise.race([
          processUnknownWords(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Classification timeout')), FINALIZATION_TIMEOUT_MS)
          ),
        ]);
      } catch (err) {
        console.warn('[Scanner] Classification timed out or failed:', err);
        // Continue anyway - show results with pending items
      }
    }

    // Now show the summary modal
    showSummaryModal();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isScanning, storeStopScanning, processUnknownWords, setIsFinalizingResults, showSummaryModal]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
    };
  }, []);

  // Get elapsed time in seconds
  const getElapsedTime = useCallback((): number => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  }, [sessionStartTime]);

  // Dismiss summary modal
  const dismissSummary = useCallback(() => {
    setShowSummary(false);
  }, [setShowSummary]);

  // Start a new scan (clear previous and start fresh)
  const scanAgain = useCallback(() => {
    clearSession();
    startScanning();
  }, [clearSession, startScanning]);

  return {
    // Refs
    cameraRef,

    // State
    isScanning,
    detectedItems,
    pendingRequests,
    error,
    showSummary,
    isFinalizingResults,
    isProcessing: pendingRequests > 0,

    // Computed
    getElapsedTime,
    getUniqueItems,
    detectedCount: detectedItems.length,

    // Actions
    startScanning,
    stopScanning,
    clearSession,
    dismissSummary,
    scanAgain,
  };
}
