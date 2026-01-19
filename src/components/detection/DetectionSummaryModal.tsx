import { View, Text, StyleSheet, Modal, Pressable, ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { useState, useMemo, useEffect } from 'react';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import type { DetectedItem } from '@/types';
import { DetectedItemRow } from './DetectedItemRow';

type DetectionSummaryModalProps = {
  visible: boolean;
  items: DetectedItem[];
  onDismiss: () => void;
  onAddSelected: (items: DetectedItem[]) => void;
  onScanAgain: () => void;
};

export function DetectionSummaryModal({
  visible,
  items,
  onDismiss,
  onAddSelected,
  onScanAgain,
}: DetectionSummaryModalProps) {
  // Track selected item IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort items by confidence
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.confidence - a.confidence);
  }, [items]);

  // Animate items when list changes (items classified/removed)
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [items]);

  // Count pending and confirmed items
  const pendingCount = items.filter(item => item.isPending).length;
  const confirmedCount = items.length - pendingCount;

  // Initialize selection when modal opens - only select non-pending items with high confidence
  useMemo(() => {
    if (visible && items.length > 0) {
      // Select non-pending items with confidence >= 0.7 by default
      const defaultSelected = new Set(
        items
          .filter((item) => !item.isPending && item.confidence >= 0.7)
          .map((item) => item.id)
      );
      setSelectedIds(defaultSelected);
    }
  }, [visible, items]);

  const toggleItem = (id: string) => {
    // Don't allow toggling pending items
    const item = items.find(i => i.id === id);
    if (item?.isPending) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    // Only select non-pending items
    setSelectedIds(new Set(
      items.filter(item => !item.isPending).map((item) => item.id)
    ));
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const selectedCount = selectedIds.size;

  const handleAddSelected = () => {
    onAddSelected(selectedItems);
    onDismiss();
  };

  const handleAddAll = () => {
    // Only add non-pending items
    onAddSelected(items.filter(item => !item.isPending));
    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Review Detected Items</Text>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Text style={styles.closeButton}>x</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items detected</Text>
              <Text style={styles.emptySubtext}>
                Try scanning again with better lighting
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.selectAllRow}>
                <Text style={styles.countText}>
                  {selectedCount} of {confirmedCount} selected
                  {pendingCount > 0 && (
                    <Text style={styles.pendingCountText}> ({pendingCount} verifying)</Text>
                  )}
                </Text>
                <Pressable onPress={selectAll}>
                  <Text style={styles.selectAllText}>Select All</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {sortedItems.map((item) => (
                  <DetectedItemRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={toggleItem}
                  />
                ))}
              </ScrollView>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onScanAgain}
                >
                  <Text style={styles.secondaryButtonText}>Scan Again</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.button,
                    styles.primaryButton,
                    selectedCount === 0 && styles.disabledButton,
                  ]}
                  onPress={handleAddSelected}
                  disabled={selectedCount === 0}
                >
                  <Text style={styles.primaryButtonText}>
                    Add Selected ({selectedCount})
                  </Text>
                </Pressable>
              </View>

              <Pressable style={styles.addAllButton} onPress={handleAddAll} disabled={confirmedCount === 0}>
                <Text style={[styles.addAllText, confirmedCount === 0 && styles.disabledText]}>
                  Add All ({confirmedCount})
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    color: '#6b7280',
    fontSize: 24,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  pendingCountText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  selectAllText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    maxHeight: 350,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  disabledButton: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addAllText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#6b7280',
  },
});
