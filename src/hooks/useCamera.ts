import { useRef, useState, useCallback } from 'react';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import type { CameraMode } from '@/types';

export type FlashMode = 'on' | 'off' | 'auto';
export type CameraType = 'front' | 'back';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);

  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // Camera state
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [mode, setMode] = useState<CameraMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Camera ready callback
  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Toggle camera type (front/back)
  const toggleCameraType = useCallback(() => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Toggle flash mode
  const toggleFlashMode = useCallback(() => {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Change camera mode
  const changeMode = useCallback((newMode: CameraMode) => {
    if (isRecording) return; // Don't allow mode change while recording
    setMode(newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isRecording]);

  // Take a picture
  const takePicture = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || mode !== 'photo' || !isCameraReady) return null;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      return photo?.uri ?? null;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [mode, isCameraReady]);

  // Start video recording
  const startRecording = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || mode !== 'video' || isRecording || !isCameraReady) return;

    setIsRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await cameraRef.current.recordAsync({
        maxDuration: 60, // Max 60 seconds
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, [mode, isRecording, isCameraReady]);

  // Stop video recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || !isRecording) return null;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      cameraRef.current.stopRecording();
      // Note: The video URI is returned from recordAsync when it completes
      return null; // The actual URI is obtained from the recordAsync promise
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    } finally {
      setIsRecording(false);
    }
  }, [isRecording]);

  // Handle barcode scanned
  const handleBarcodeScanned = useCallback((data: string) => {
    if (mode !== 'barcode') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Return the barcode data - actual processing will be done by the component
    return data;
  }, [mode]);

  return {
    // Refs
    cameraRef,

    // Permissions
    cameraPermission,
    microphonePermission,
    requestCameraPermission,
    requestMicrophonePermission,
    hasCameraPermission: cameraPermission?.granted ?? false,
    hasMicrophonePermission: microphonePermission?.granted ?? false,

    // Camera state
    cameraType,
    flashMode,
    mode,
    isRecording,
    isProcessing,
    isCameraReady,

    // Actions
    onCameraReady,
    toggleCameraType,
    toggleFlashMode,
    changeMode,
    takePicture,
    startRecording,
    stopRecording,
    handleBarcodeScanned,
  };
}
