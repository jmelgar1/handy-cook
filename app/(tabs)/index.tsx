import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraViewComponent,
  CaptureButton,
  CameraControls,
  ModeSelector,
  GalleryPicker,
  ScannerFrame,
} from '@/components/camera';
import { ScannerView } from '@/components/detection';
import { useCamera } from '@/hooks/useCamera';
import { usePantryStore } from '@/store/pantryStore';
import type { DetectedItem, PantryItem } from '@/types';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const {
    cameraRef,
    hasCameraPermission,
    hasMicrophonePermission,
    requestCameraPermission,
    requestMicrophonePermission,
    cameraType,
    flashMode,
    mode,
    isRecording,
    isProcessing,
    isCameraReady,
    onCameraReady,
    toggleCameraType,
    toggleFlashMode,
    changeMode,
    takePicture,
    startRecording,
    stopRecording,
  } = useCamera();

  const { addItem } = usePantryStore();
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  // Handle items detected by the scanner
  const handleItemsAdded = useCallback(
    (items: DetectedItem[]) => {
      // Convert detected items to pantry items and add them
      const timestamp = new Date().toISOString();
      items.forEach((item) => {
        const pantryItem: PantryItem = {
          id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'current-user', // TODO: Get from auth store
          name: item.label,
          quantity: '1',
          category: 'Other', // Use Vision's label as-is, user can categorize later
          addedVia: 'image',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        addItem(pantryItem);
      });

      Alert.alert(
        'Items Added',
        `${items.length} item${items.length === 1 ? '' : 's'} added to your pantry!`,
        [{ text: 'OK' }]
      );
    },
    [addItem]
  );

  // Handle barcode scanned
  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (result.data === lastBarcode) return;
      setLastBarcode(result.data);
      setTimeout(() => setLastBarcode(null), 3000);
      Alert.alert('Barcode Scanned', `Code: ${result.data}\nType: ${result.type}`, [
        { text: 'OK' },
      ]);
    },
    [lastBarcode]
  );

  // Handle capture button tap
  const handleCaptureTap = useCallback(async () => {
    // Request permission if not granted
    if (!hasCameraPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in settings to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (mode === 'photo') {
      const uri = await takePicture();
      if (uri) {
        Alert.alert('Photo Captured', 'Photo saved successfully!', [{ text: 'OK' }]);
      }
    }
  }, [mode, takePicture, hasCameraPermission, requestCameraPermission]);

  // Handle long press start (video mode)
  const handleLongPressStart = useCallback(async () => {
    if (!hasCameraPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in settings to record video.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (mode === 'video' && !hasMicrophonePermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in settings to record video with audio.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (mode === 'video') {
      startRecording();
    }
  }, [mode, startRecording, hasCameraPermission, hasMicrophonePermission, requestCameraPermission, requestMicrophonePermission]);

  // Handle long press end (video mode)
  const handleLongPressEnd = useCallback(() => {
    if (mode === 'video' && isRecording) {
      stopRecording();
      Alert.alert('Recording Stopped', 'Video saved successfully!', [{ text: 'OK' }]);
    }
  }, [mode, isRecording, stopRecording]);

  // Handle gallery image selection
  const handleImageSelected = useCallback((uri: string) => {
    Alert.alert('Image Selected', `Selected: ${uri.split('/').pop()}`, [{ text: 'OK' }]);
  }, []);

  // Handle camera control taps when no permission
  const handleControlTap = useCallback(async () => {
    if (!hasCameraPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in settings.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [hasCameraPermission, requestCameraPermission]);

  // Determine if we should show permission overlay
  const showPermissionOverlay = !hasCameraPermission;
  const needsMicPermission = mode === 'video' && !hasMicrophonePermission;

  // Render ScannerView for scan mode
  if (mode === 'scan') {
    return (
      <View style={styles.container}>
        {hasCameraPermission ? (
          <ScannerView
            onItemsAdded={handleItemsAdded}
            flashMode={flashMode}
            cameraType={cameraType}
          />
        ) : (
          <View style={styles.placeholder}>
            <TouchableOpacity
              style={styles.permissionCard}
              onPress={requestCameraPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.permissionTitle}>Camera Access Needed</Text>
              <Text style={styles.permissionText}>
                Tap here to enable camera access for scanning food items
              </Text>
              <View style={styles.enableButton}>
                <Text style={styles.enableButtonText}>Enable Camera</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Mode Selector at bottom */}
        <View style={styles.scanModeSelector}>
          <ModeSelector currentMode={mode} onModeChange={changeMode} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View or Placeholder */}
      {hasCameraPermission ? (
        <CameraViewComponent
          ref={cameraRef}
          cameraType={cameraType}
          flashMode={flashMode}
          mode={mode}
          onBarcodeScanned={handleBarcodeScanned}
          onCameraReady={onCameraReady}
        />
      ) : (
        <View style={styles.placeholder}>
          <TouchableOpacity
            style={styles.permissionCard}
            onPress={requestCameraPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>
              Tap here to enable camera access for scanning and capturing food items
            </Text>
            <View style={styles.enableButton}>
              <Text style={styles.enableButtonText}>Enable Camera</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Microphone warning for video mode */}
      {hasCameraPermission && needsMicPermission && (
        <TouchableOpacity
          style={[styles.micWarning, { top: insets.top + 60 }]}
          onPress={requestMicrophonePermission}
        >
          <Text style={styles.micWarningText}>
            🎤 Tap to enable microphone for video recording
          </Text>
        </TouchableOpacity>
      )}

      {/* Scanner Frame Overlay (barcode mode only) */}
      {hasCameraPermission && (
        <ScannerFrame visible={mode === 'barcode'} scanning={!lastBarcode} />
      )}

      {/* Camera Controls (flip, flash) */}
      <CameraControls
        flashMode={flashMode}
        onFlashToggle={hasCameraPermission ? toggleFlashMode : handleControlTap}
        onCameraFlip={hasCameraPermission ? toggleCameraType : handleControlTap}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Mode Selector */}
        <ModeSelector currentMode={mode} onModeChange={changeMode} />

        {/* Capture Area */}
        <View style={styles.captureArea}>
          {/* Gallery Picker */}
          <GalleryPicker onImageSelected={handleImageSelected} />

          {/* Capture Button */}
          <CaptureButton
            mode={mode}
            isRecording={isRecording}
            disabled={isProcessing || (hasCameraPermission && !isCameraReady)}
            onTap={handleCaptureTap}
            onLongPressStart={handleLongPressStart}
            onLongPressEnd={handleLongPressEnd}
          />

          {/* Spacer for symmetry */}
          <View style={styles.spacer} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  cameraIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: '#AA4A44',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  micWarning: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  micWarningText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  captureArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  spacer: {
    width: 44,
    height: 44,
  },
  scanModeSelector: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
});
