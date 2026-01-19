import { View, Text, StyleSheet } from 'react-native';

type UnlockProgressProps = {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
};

export function UnlockProgress({
  current,
  total,
  showLabel = true,
  size = 'medium',
}: UnlockProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const isUnlocked = progress >= 100;

  const heights = {
    small: 4,
    medium: 6,
    large: 8,
  };

  const fontSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { height: heights[size] }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: isUnlocked ? '#AA4A44' : '#fbbf24',
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: fontSizes[size] }]}>
          {isUnlocked ? '✓ Unlocked' : `${current}/${total}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  label: {
    color: '#6b7280',
    minWidth: 50,
  },
});
