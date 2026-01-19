import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FlashMode = 'on' | 'off' | 'auto';

type CameraControlsProps = {
  flashMode: FlashMode;
  onFlashToggle: () => void;
  onCameraFlip: () => void;
};

export function CameraControls({ flashMode, onFlashToggle, onCameraFlip }: CameraControlsProps) {
  const insets = useSafeAreaInsets();

  const isFlashOff = flashMode === 'off';

  return (
    <View style={[styles.container, { top: insets.top + 16 }]}>
      <TouchableOpacity style={styles.button} onPress={onCameraFlip} activeOpacity={0.7}>
        <Text style={styles.buttonText}>🔄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isFlashOff && styles.buttonDisabled]}
        onPress={onFlashToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isFlashOff && styles.buttonTextDisabled]}>⚡</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    gap: 16,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
