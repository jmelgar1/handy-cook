import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import type { CameraMode } from '@/types';

type ModeSelectorProps = {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
};

const MODES: { key: CameraMode; label: string }[] = [
  { key: 'barcode', label: 'Barcode' },
  { key: 'photo', label: 'Photo' },
  { key: 'video', label: 'Video' },
  { key: 'scan', label: 'Scan' },
];

const BUTTON_WIDTH = 80;
const UNDERLINE_WIDTH = 40;

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const underlineAnim = useRef(new Animated.Value(getModeIndex(currentMode))).current;

  useEffect(() => {
    Animated.timing(underlineAnim, {
      toValue: getModeIndex(currentMode),
      useNativeDriver: true,
      duration: 200,
    }).start();
  }, [currentMode, underlineAnim]);

  function getModeIndex(mode: CameraMode): number {
    return MODES.findIndex((m) => m.key === mode);
  }

  // Calculate center position for each button
  const centerOffset = (BUTTON_WIDTH - UNDERLINE_WIDTH) / 2;
  const translateX = underlineAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      centerOffset,
      BUTTON_WIDTH + centerOffset,
      BUTTON_WIDTH * 2 + centerOffset,
      BUTTON_WIDTH * 3 + centerOffset,
    ],
  });

  return (
    <View style={styles.container}>
      <View style={styles.modesWrapper}>
        <View style={styles.modesContainer}>
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={styles.modeButton}
              onPress={() => onModeChange(mode.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.modeText, currentMode === mode.key && styles.modeTextActive]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View
          style={[
            styles.underline,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modesWrapper: {
    position: 'relative',
  },
  modesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeButton: {
    width: BUTTON_WIDTH,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: UNDERLINE_WIDTH,
    height: 2,
    backgroundColor: '#AA4A44',
    borderRadius: 1,
  },
});
