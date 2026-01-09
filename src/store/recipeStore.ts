import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, UserRecipeProgress } from '../types';

type RecipeState = {
  recipes: Recipe[];
  favorites: string[]; // Recipe IDs
  userProgress: Record<string, UserRecipeProgress>; // keyed by recipe ID
  cachedRecipes: Recipe[]; // Offline cache
  isLoading: boolean;
  searchQuery: string;
  filters: RecipeFilters;
};

type RecipeFilters = {
  cuisine?: string;
  maxPrepTime?: number;
  tags?: string[];
  onlyUnlocked?: boolean;
  onlyAlmostReady?: boolean; // Missing 1-2 ingredients
};

type RecipeActions = {
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;
  toggleFavorite: (recipeId: string) => void;
  setUserProgress: (recipeId: string, progress: UserRecipeProgress) => void;
  updateCachedRecipes: (recipes: Recipe[]) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  clearFilters: () => void;
  getFilteredRecipes: () => Recipe[];
  getUnlockedRecipes: () => Recipe[];
  getAlmostReadyRecipes: () => Recipe[];
  reset: () => void;
};

const initialState: RecipeState = {
  recipes: [],
  favorites: [],
  userProgress: {},
  cachedRecipes: [],
  isLoading: false,
  searchQuery: '',
  filters: {},
};

export const useRecipeStore = create<RecipeState & RecipeActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRecipes: (recipes) => set({ recipes }),

      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [...state.recipes, recipe],
        })),

      updateRecipe: (id, updates) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id ? { ...recipe, ...updates } : recipe
          ),
        })),

      removeRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
        })),

      toggleFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.includes(recipeId)
            ? state.favorites.filter((id) => id !== recipeId)
            : [...state.favorites, recipeId],
        })),

      setUserProgress: (recipeId, progress) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            [recipeId]: progress,
          },
        })),

      updateCachedRecipes: (recipes) =>
        set((state) => {
          const existingIds = new Set(state.cachedRecipes.map((r) => r.id));
          const newRecipes = recipes.filter((r) => !existingIds.has(r.id));
          return {
            cachedRecipes: [...state.cachedRecipes, ...newRecipes].slice(-100), // Keep last 100
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearFilters: () => set({ filters: {} }),

      getFilteredRecipes: () => {
        const { recipes, searchQuery, filters } = get();
        return recipes.filter((recipe) => {
          // Search query
          if (
            searchQuery &&
            !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          // Cuisine filter
          if (filters.cuisine && recipe.cuisine !== filters.cuisine) {
            return false;
          }
          // Prep time filter
          if (
            filters.maxPrepTime &&
            recipe.prepTime + recipe.cookTime > filters.maxPrepTime
          ) {
            return false;
          }
          // Tags filter
          if (
            filters.tags &&
            filters.tags.length > 0 &&
            !filters.tags.some((tag) => recipe.tags.includes(tag))
          ) {
            return false;
          }
          return true;
        });
      },

      getUnlockedRecipes: () => {
        const { recipes, userProgress } = get();
        return recipes.filter((recipe) => {
          const progress = userProgress[recipe.id];
          return (
            progress &&
            progress.unlockProgress >= progress.totalIngredients
          );
        });
      },

      getAlmostReadyRecipes: () => {
        const { recipes, userProgress } = get();
        return recipes.filter((recipe) => {
          const progress = userProgress[recipe.id];
          if (!progress) return false;
          const missing = progress.totalIngredients - progress.unlockProgress;
          return missing > 0 && missing <= 2;
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        userProgress: state.userProgress,
        cachedRecipes: state.cachedRecipes,
      }),
    }
  )
);
