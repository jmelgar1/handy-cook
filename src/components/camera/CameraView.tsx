import { StyleSheet } from 'react-native';
import { CameraView as ExpoCameraView, BarcodeScanningResult } from 'expo-camera';
import { forwardRef } from 'react';
import type { CameraMode } from '@/types';

type CameraViewProps = {
  cameraType: 'front' | 'back';
  flashMode: 'on' | 'off' | 'auto';
  mode: CameraMode;
  onBarcodeScanned?: (result: BarcodeScanningResult) => void;
  onCameraReady?: () => void;
};

export const CameraViewComponent = forwardRef<ExpoCameraView, CameraViewProps>(
  ({ cameraType, flashMode, mode, onBarcodeScanned, onCameraReady }, ref) => {
    return (
      <ExpoCameraView
        ref={ref}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        onCameraReady={onCameraReady}
        barcodeScannerSettings={
          mode === 'barcode'
            ? {
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'qr',
                ],
              }
            : undefined
        }
        onBarcodeScanned={mode === 'barcode' ? onBarcodeScanned : undefined}
      />
    );
  }
);

CameraViewComponent.displayName = 'CameraView';

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
