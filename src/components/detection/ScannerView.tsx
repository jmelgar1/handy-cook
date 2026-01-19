import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { forwardRef, useState, useEffect } from 'react';
import { ScanningIndicator } from './ScanningIndicator';
import { DetectionList } from './DetectionList';
import { ItemCounter } from './ItemCounter';
import { DetectionSummaryModal } from './DetectionSummaryModal';
import { useFoodScanner } from '@/hooks/useFoodScanner';
import type { DetectedItem } from '@/types';

type ScannerViewProps = {
  onItemsAdded?: (items: DetectedItem[]) => void;
  flashMode?: 'on' | 'off' | 'auto';
  cameraType?: 'front' | 'back';
};

export const ScannerView = forwardRef<CameraView, ScannerViewProps>(
  ({ onItemsAdded, flashMode = 'off', cameraType = 'back' }, ref) => {
    const {
      cameraRef,
      isScanning,
      detectedItems,
      isProcessing,
      error,
      showSummary,
      isFinalizingResults,
      getElapsedTime,
      startScanning,
      stopScanning,
      dismissSummary,
      scanAgain,
    } = useFoodScanner();

    const [elapsedTime, setElapsedTime] = useState(0);

    // Update elapsed time every second while scanning
    useEffect(() => {
      let interval: ReturnType<typeof setInterval> | undefined;
      if (isScanning) {
        interval = setInterval(() => {
          setElapsedTime(getElapsedTime());
        }, 1000);
      } else {
        setElapsedTime(0);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isScanning, getElapsedTime]);

    const handleAddItems = (items: DetectedItem[]) => {
      onItemsAdded?.(items);
    };

    // Use internal ref if none provided
    const actualRef = ref || cameraRef;

    return (
      <View style={styles.container}>
        <CameraView
          ref={actualRef as React.RefObject<CameraView>}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        />

        {/* Scanning overlay */}
        <View style={styles.overlay}>
          {/* Top section - Scanning indicator */}
          <View style={styles.topSection}>
            {isScanning && (
              <ScanningIndicator
                elapsedSeconds={elapsedTime}
                isProcessing={isProcessing}
              />
            )}
            {!isScanning && detectedItems.length > 0 && (
              <ItemCounter count={detectedItems.length} />
            )}
          </View>

          {/* Middle section - Detection list */}
          <View style={styles.middleSection}>
            {isScanning && <DetectionList items={detectedItems} />}
          </View>

          {/* Bottom section - Controls */}
          <View style={styles.bottomSection}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!isScanning ? (
              <Pressable style={styles.startButton} onPress={startScanning}>
                <Text style={styles.startButtonText}>Start Scanning</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.stopButton} onPress={stopScanning}>
                <Text style={styles.stopButtonText}>Stop Scanning</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Finalization overlay - shows while waiting for classifications */}
        {isFinalizingResults && (
          <View style={styles.finalizingOverlay}>
            <View style={styles.finalizingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.finalizingText}>Finalizing results...</Text>
            </View>
          </View>
        )}

        {/* Summary modal */}
        <DetectionSummaryModal
          visible={showSummary}
          items={detectedItems}
          onDismiss={dismissSummary}
          onAddSelected={handleAddItems}
          onScanAgain={scanAgain}
        />
      </View>
    );
  }
);

ScannerView.displayName = 'ScannerView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 60,
    alignItems: 'center',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  finalizingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  finalizingContainer: {
    backgroundColor: '#1f2937',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  finalizingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
});
