import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import type { CameraMode } from '@/types';

type CaptureButtonProps = {
  mode: CameraMode;
  isRecording: boolean;
  disabled?: boolean;
  onTap: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
};

export function CaptureButton({
  mode,
  isRecording,
  disabled = false,
  onTap,
  onLongPressStart,
  onLongPressEnd,
}: CaptureButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for barcode mode
  useEffect(() => {
    if (mode === 'barcode') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [mode, pulseAnim]);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      Animated.timing(recordingAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(recordingAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, recordingAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();

    if (mode === 'video') {
      onLongPressStart();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (mode === 'video') {
      onLongPressEnd();
    } else if (mode === 'photo') {
      onTap();
    }
    // Barcode mode doesn't need tap - it auto-scans
  };

  const innerScale = recordingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const innerBorderRadius = recordingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 8],
  });

  const getInnerColor = () => {
    if (isRecording) return '#ef4444'; // Red when recording
    if (mode === 'barcode') return '#AA4A44'; // Green for barcode
    return '#fff'; // White for photo/video
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: mode === 'barcode' ? pulseAnim : scaleAnim }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.button}
      >
        <View style={styles.outerRing}>
          <Animated.View
            style={[
              styles.innerCircle,
              {
                backgroundColor: getInnerColor(),
                transform: [{ scale: innerScale }],
                borderRadius: innerBorderRadius,
              },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
