import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { DetectedItem } from '@/types';

type DetectionListProps = {
  items: DetectedItem[];
  maxVisible?: number;
};

// Get icon based on detection source
const getSourceIcon = (source: string): string => {
  switch (source) {
    case 'logo':
      return '\u{1F3F7}'; // Label tag
    case 'ocr':
      return '\u{1F4DD}'; // Memo
    case 'object':
      return '\u{1F4E6}'; // Package
    case 'label':
    default:
      return '\u{1F34E}'; // Apple (food)
  }
};

export function DetectionList({ items, maxVisible = 5 }: DetectionListProps) {
  // Sort by confidence and take top items
  const sortedItems = [...items]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxVisible);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Point camera at food items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Detected Items:</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {sortedItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.icon}>{getSourceIcon(item.source)}</Text>
            <Text style={styles.label}>
              {item.label}
            </Text>
            {item.isPending ? (
              <View style={styles.pendingIndicator}>
                <ActivityIndicator size="small" color="#9ca3af" />
                <Text style={styles.pendingText}>verifying...</Text>
              </View>
            ) : (
              <Text style={styles.confidence}>{Math.round(item.confidence * 100)}%</Text>
            )}
          </View>
        ))}
        {items.length > maxVisible && (
          <Text style={styles.moreText}>+{items.length - maxVisible} more</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  emptyContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  header: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  list: {
    maxHeight: 150,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  confidence: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  pendingText: {
    color: '#9ca3af',
    fontSize: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  moreText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
});
