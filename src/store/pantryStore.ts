import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PantryItem, FoodCategory } from '../types';

type PantryState = {
  items: PantryItem[];
  isLoading: boolean;
  lastSynced: string | null;
  pendingSync: string[]; // IDs of items pending sync
};

type PantryActions = {
  setItems: (items: PantryItem[]) => void;
  addItem: (item: PantryItem) => void;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setLastSynced: (timestamp: string) => void;
  addPendingSync: (id: string) => void;
  removePendingSync: (id: string) => void;
  clearPendingSync: () => void;
  getItemsByCategory: (category: FoodCategory) => PantryItem[];
  getExpiringItems: (daysThreshold: number) => PantryItem[];
  reset: () => void;
};

const initialState: PantryState = {
  items: [],
  isLoading: false,
  lastSynced: null,
  pendingSync: [],
};

export const usePantryStore = create<PantryState & PantryActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setItems: (items) => set({ items }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
          pendingSync: [...state.pendingSync, item.id],
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
          ),
          pendingSync: state.pendingSync.includes(id)
            ? state.pendingSync
            : [...state.pendingSync, id],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setLastSynced: (timestamp) => set({ lastSynced: timestamp }),

      addPendingSync: (id) =>
        set((state) => ({
          pendingSync: state.pendingSync.includes(id)
            ? state.pendingSync
            : [...state.pendingSync, id],
        })),

      removePendingSync: (id) =>
        set((state) => ({
          pendingSync: state.pendingSync.filter((syncId) => syncId !== id),
        })),

      clearPendingSync: () => set({ pendingSync: [] }),

      getItemsByCategory: (category) => {
        return get().items.filter((item) => item.category === category);
      },

      getExpiringItems: (daysThreshold) => {
        const now = new Date();
        const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
        return get().items.filter((item) => {
          if (!item.expiresAt) return false;
          const expiryDate = new Date(item.expiresAt);
          return expiryDate <= threshold && expiryDate >= now;
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'pantry-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
