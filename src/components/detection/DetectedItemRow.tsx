import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import type { DetectedItem } from '@/types';

type DetectedItemRowProps = {
  item: DetectedItem;
  selected: boolean;
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
};

// Get badge text based on detection source
const getSourceBadge = (source: string): string => {
  switch (source) {
    case 'logo':
      return 'logo';
    case 'ocr':
      return 'text';
    case 'object':
      return 'object';
    case 'label':
    default:
      return 'label';
  }
};

export function DetectedItemRow({ item, selected, onToggle, onRemove }: DetectedItemRowProps) {
  const confidenceColor =
    item.confidence >= 0.8 ? '#22c55e' : item.confidence >= 0.6 ? '#eab308' : '#ef4444';

  return (
    <Pressable
      style={[styles.container, selected && styles.selected, item.isPending && styles.pending]}
      onPress={() => !item.isPending && onToggle(item.id)}
      disabled={item.isPending}
    >
      <View style={styles.checkbox}>
        {selected && <View style={styles.checkboxInner} />}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>
          {item.label}
        </Text>
        <View style={styles.meta}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>{getSourceBadge(item.source)}</Text>
          </View>
          {item.count > 1 && (
            <Text style={styles.countText}>x{item.count}</Text>
          )}
        </View>
      </View>

      {item.isPending ? (
        <View style={styles.pendingBadge}>
          <ActivityIndicator size="small" color="#6b7280" />
          <Text style={styles.pendingLabel}>verifying</Text>
        </View>
      ) : (
        <Text style={[styles.confidence, { color: confidenceColor }]}>
          {Math.round(item.confidence * 100)}%
        </Text>
      )}

      {onRemove && (
        <Pressable
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
          hitSlop={8}
        >
          <Text style={styles.removeText}>x</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 8,
  },
  selected: {
    backgroundColor: '#374151',
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#22c55e',
  },
  content: {
    flex: 1,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceText: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  countText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginTop: 2,
  },
  pending: {
    opacity: 0.6,
    borderColor: '#4b5563',
    borderWidth: 1,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    marginTop: 2,
  },
  pendingLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  removeText: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '600',
  },
});
