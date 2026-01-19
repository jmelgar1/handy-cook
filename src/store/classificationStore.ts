import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodCategory } from '../types';

// Classification result from backend
export type WordClassification = {
  isFood: boolean;
  category: FoodCategory | null;
  source: 'usda' | 'spoonacular' | 'cached' | 'seed' | 'not_found';
  confidence: number;
};

type ClassificationState = {
  foodWords: Record<string, string[]>; // category → words
  nonFoodWords: string[];
  genericWords: string[];
  lastSynced: string | null;
  pendingClassifications: string[]; // unknown words awaiting classification
  isLoading: boolean;
};

type ClassificationActions = {
  setWordLists: (data: {
    foodWords: Record<string, string[]>;
    nonFoodWords: string[];
    genericWords: string[];
  }) => void;
  addPendingWord: (word: string) => void;
  addPendingWords: (words: string[]) => void;
  clearPendingWords: () => void;
  updateFromClassifications: (
    results: Record<string, WordClassification>
  ) => void;
  setLastSynced: (date: string) => void;
  setLoading: (isLoading: boolean) => void;
  // Lookup helpers
  isFood: (word: string) => boolean | null;
  isGeneric: (word: string) => boolean;
  getCategory: (word: string) => FoodCategory | null;
  getAllFoodWords: () => Set<string>;
  reset: () => void;
};

const initialState: ClassificationState = {
  foodWords: {},
  nonFoodWords: [],
  genericWords: [],
  lastSynced: null,
  pendingClassifications: [],
  isLoading: false,
};

export const useClassificationStore = create<
  ClassificationState & ClassificationActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      setWordLists: (data) =>
        set({
          foodWords: data.foodWords,
          nonFoodWords: data.nonFoodWords,
          genericWords: data.genericWords,
        }),

      addPendingWord: (word) =>
        set((state) => {
          const normalized = word.toLowerCase().trim();
          if (state.pendingClassifications.includes(normalized)) {
            return state;
          }
          return {
            pendingClassifications: [...state.pendingClassifications, normalized],
          };
        }),

      addPendingWords: (words) =>
        set((state) => {
          const normalizedNew = words
            .map((w) => w.toLowerCase().trim())
            .filter((w) => !state.pendingClassifications.includes(w));
          if (normalizedNew.length === 0) return state;
          return {
            pendingClassifications: [
              ...state.pendingClassifications,
              ...normalizedNew,
            ],
          };
        }),

      clearPendingWords: () => set({ pendingClassifications: [] }),

      updateFromClassifications: (results) =>
        set((state) => {
          const newFoodWords = { ...state.foodWords };
          const newNonFoodWords = [...state.nonFoodWords];
          const classifiedWords = Object.keys(results);

          for (const word of classifiedWords) {
            const classification = results[word];

            if (classification.isFood && classification.category) {
              // Add to appropriate food category
              const category = classification.category;
              if (!newFoodWords[category]) {
                newFoodWords[category] = [];
              }
              if (!newFoodWords[category].includes(word)) {
                newFoodWords[category].push(word);
              }
            } else if (!classification.isFood) {
              // Add to non-food list
              if (!newNonFoodWords.includes(word)) {
                newNonFoodWords.push(word);
              }
            }
          }

          // Remove classified words from pending
          const stillPending = state.pendingClassifications.filter(
            (w) => !classifiedWords.includes(w)
          );

          return {
            foodWords: newFoodWords,
            nonFoodWords: newNonFoodWords,
            pendingClassifications: stillPending,
          };
        }),

      setLastSynced: (date) => set({ lastSynced: date }),

      setLoading: (isLoading) => set({ isLoading }),

      isFood: (word) => {
        const normalized = word.toLowerCase().trim();
        const { foodWords, nonFoodWords } = get();

        // Check if it's in any food category
        for (const words of Object.values(foodWords)) {
          if (words.includes(normalized)) {
            return true;
          }
        }

        // Check if it's in non-food list
        if (nonFoodWords.includes(normalized)) {
          return false;
        }

        // Unknown
        return null;
      },

      isGeneric: (word) => {
        const normalized = word.toLowerCase().trim();
        return get().genericWords.includes(normalized);
      },

      getCategory: (word) => {
        const normalized = word.toLowerCase().trim();
        const { foodWords } = get();

        for (const [category, words] of Object.entries(foodWords)) {
          if (words.includes(normalized)) {
            return category as FoodCategory;
          }
        }

        return null;
      },

      getAllFoodWords: () => {
        const { foodWords } = get();
        const allWords = new Set<string>();
        for (const words of Object.values(foodWords)) {
          for (const word of words) {
            allWords.add(word);
          }
        }
        return allWords;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'classification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        foodWords: state.foodWords,
        nonFoodWords: state.nonFoodWords,
        genericWords: state.genericWords,
        lastSynced: state.lastSynced,
        // Exclude isLoading and pendingClassifications from persistence
      }),
    }
  )
);
