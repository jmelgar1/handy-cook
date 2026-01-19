import { View, StyleSheet, Animated, Text } from 'react-native';
import { useRef, useEffect } from 'react';

type ScannerFrameProps = {
  visible: boolean;
  scanning?: boolean;
};

export function ScannerFrame({ visible, scanning = true }: ScannerFrameProps) {
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && scanning) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(lineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(lineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [visible, scanning, lineAnim]);

  if (!visible) return null;

  const translateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Height of scanner frame minus line height
  });

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        {/* Corner markers */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* Scanning line */}
        {scanning && (
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY }],
              },
            ]}
          />
        )}
      </View>

      <Text style={styles.instruction}>Point at a barcode to scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#AA4A44',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#AA4A44',
    shadowColor: '#AA4A44',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  instruction: {
    marginTop: 24,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
