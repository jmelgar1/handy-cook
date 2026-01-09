import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  category: string;
  expiresAt?: string;
  addedVia: 'manual' | 'barcode' | 'image';
};

const MOCK_PANTRY: PantryItem[] = [
  { id: '1', name: 'Eggs', quantity: '12', category: 'Dairy', addedVia: 'barcode' },
  { id: '2', name: 'Milk', quantity: '1L', category: 'Dairy', expiresAt: '2024-01-15', addedVia: 'barcode' },
  { id: '3', name: 'Onions', quantity: '3', category: 'Vegetables', addedVia: 'image' },
  { id: '4', name: 'Pasta', quantity: '500g', category: 'Pantry Staples', addedVia: 'manual' },
];

const CATEGORIES = ['All', 'Dairy', 'Vegetables', 'Pantry Staples', 'Meat', 'Fruits'];

export default function PantryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = MOCK_PANTRY.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getAddedViaIcon = (addedVia: PantryItem['addedVia']) => {
    switch (addedVia) {
      case 'barcode':
        return '📊';
      case 'image':
        return '📷';
      default:
        return '✏️';
    }
  };

  const renderPantryItem = ({ item }: { item: PantryItem }) => (
    <View style={styles.pantryItem}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {item.quantity} • {item.category} {getAddedViaIcon(item.addedVia)}
        </Text>
        {item.expiresAt && (
          <Text style={styles.expiryText}>Expires: {item.expiresAt}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pantry..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item && styles.categoryChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoriesContainer}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>{filteredItems.length} items in pantry</Text>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderPantryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥫</Text>
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptySubtext}>Scan items or add them manually</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryChipText: {
    color: '#6b7280',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  summaryText: {
    color: '#6b7280',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  pantryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  expiryText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  editButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#22c55e',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
