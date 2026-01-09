import { useCallback } from 'react';
import { usePantryStore } from '../store/pantryStore';
import { pantryApi } from '../services/api';
import type { PantryItem, FoodCategory } from '../types';

export function usePantry() {
  const {
    items,
    isLoading,
    lastSynced,
    pendingSync,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setLoading,
    setLastSynced,
    clearPendingSync,
    getItemsByCategory,
    getExpiringItems,
  } = usePantryStore();

  // Fetch pantry items from API
  const fetchPantry = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pantryApi.list();
      if (response.success && response.data) {
        setItems(response.data as PantryItem[]);
        setLastSynced(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to fetch pantry:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setItems, setLastSynced]);

  // Add new item to pantry
  const addPantryItem = useCallback(
    async (item: Omit<PantryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const newItem: PantryItem = {
        ...item,
        id: `temp-${Date.now()}`, // Temporary ID until synced
        userId: '', // Will be set by backend
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add locally first (optimistic update)
      addItem(newItem);

      // Sync to backend
      try {
        const response = await pantryApi.add(newItem);
        if (response.success && response.data) {
          // Update with server-assigned ID
          updateItem(newItem.id, response.data as Partial<PantryItem>);
        }
      } catch (error) {
        console.error('Failed to sync item:', error);
        // Item remains in local storage with pending sync flag
      }
    },
    [addItem, updateItem]
  );

  // Update existing item
  const updatePantryItem = useCallback(
    async (id: string, updates: Partial<PantryItem>) => {
      // Update locally first
      updateItem(id, updates);

      // Sync to backend
      try {
        await pantryApi.update(id, updates);
      } catch (error) {
        console.error('Failed to update item:', error);
      }
    },
    [updateItem]
  );

  // Remove item from pantry
  const removePantryItem = useCallback(
    async (id: string) => {
      // Remove locally first
      removeItem(id);

      // Sync to backend
      try {
        await pantryApi.delete(id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    },
    [removeItem]
  );

  // Sync pending changes to backend
  const syncPendingItems = useCallback(async () => {
    if (pendingSync.length === 0) return;

    setLoading(true);
    try {
      // In a real implementation, this would batch sync all pending items
      clearPendingSync();
      setLastSynced(new Date().toISOString());
    } catch (error) {
      console.error('Failed to sync pending items:', error);
    } finally {
      setLoading(false);
    }
  }, [pendingSync, setLoading, clearPendingSync, setLastSynced]);

  // Get items grouped by category
  const getGroupedItems = useCallback(() => {
    const categories: FoodCategory[] = [
      'Dairy',
      'Vegetables',
      'Fruits',
      'Meat',
      'Seafood',
      'Pantry Staples',
      'Condiments',
      'Beverages',
      'Frozen',
      'Bakery',
      'Other',
    ];

    return categories
      .map((category) => ({
        category,
        items: getItemsByCategory(category),
      }))
      .filter((group) => group.items.length > 0);
  }, [getItemsByCategory]);

  return {
    items,
    isLoading,
    lastSynced,
    pendingSync,
    fetchPantry,
    addPantryItem,
    updatePantryItem,
    removePantryItem,
    syncPendingItems,
    getGroupedItems,
    getExpiringItems,
  };
}
