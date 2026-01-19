import { classificationApi, ClassificationResult } from './api';
import {
  useClassificationStore,
  WordClassification,
} from '../store/classificationStore';
import type { FoodCategory } from '../types';

// How long before we consider the cache stale (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Service for food word classification with local caching and backend sync.
 *
 * Usage:
 * 1. Call initialize() on app start to load from store
 * 2. Call syncFromBackend() periodically to refresh cache
 * 3. Use isFood/isGeneric/getCategory for instant lookups
 * 4. Use classifyUnknownWords() for batch classification of unknowns
 */
class FoodClassificationService {
  private initialized = false;
  private syncing = false;

  /**
   * Initialize the service by loading from store.
   * Should be called on app start.
   */
  async initialize(): Promise<void> {
    // Store is automatically loaded from AsyncStorage by Zustand persist
    this.initialized = true;
  }

  /**
   * Check if a word is a known food item.
   * @returns true if food, false if non-food, null if unknown
   */
  isFood(word: string): boolean | null {
    const store = useClassificationStore.getState();
    return store.isFood(word);
  }

  /**
   * Check if a word is too generic to be useful (e.g., "food", "ingredient").
   */
  isGeneric(word: string): boolean {
    const store = useClassificationStore.getState();
    return store.isGeneric(word);
  }

  /**
   * Get the food category for a word.
   * @returns category if known food, null otherwise
   */
  getCategory(word: string): FoodCategory | null {
    const store = useClassificationStore.getState();
    return store.getCategory(word);
  }

  /**
   * Get all known food words as a Set (for partial matching).
   */
  getAllFoodWords(): Set<string> {
    const store = useClassificationStore.getState();
    return store.getAllFoodWords();
  }

  /**
   * Check if the local cache needs refreshing.
   */
  isCacheStale(): boolean {
    const { lastSynced } = useClassificationStore.getState();
    if (!lastSynced) return true;

    const lastSyncTime = new Date(lastSynced).getTime();
    const now = Date.now();
    return now - lastSyncTime > CACHE_TTL_MS;
  }

  /**
   * Check if the cache has any data.
   */
  hasCache(): boolean {
    const { foodWords, nonFoodWords } = useClassificationStore.getState();
    const hasFoodWords = Object.values(foodWords).some(
      (words) => words.length > 0
    );
    return hasFoodWords || nonFoodWords.length > 0;
  }

  /**
   * Sync word lists from the backend.
   * Fetches the latest word lists and updates the local store.
   */
  async syncFromBackend(): Promise<void> {
    if (this.syncing) return;

    // Skip if cache is fresh
    if (!this.isCacheStale() && this.hasCache()) {
      return;
    }

    this.syncing = true;
    const store = useClassificationStore.getState();

    try {
      store.setLoading(true);
      const data = await classificationApi.getWordsList();

      store.setWordLists({
        foodWords: data.foodWords || {},
        nonFoodWords: data.nonFoodWords || [],
        genericWords: data.genericWords || [],
      });
      store.setLastSynced(new Date().toISOString());
    } catch (error) {
      console.error('Failed to sync word lists from backend:', error);
      // Don't throw - service can work with stale cache
    } finally {
      store.setLoading(false);
      this.syncing = false;
    }
  }

  /**
   * Classify unknown words using the backend API.
   * Results are stored in the local cache for future lookups.
   *
   * @param words Array of words to classify
   * @returns Classification results keyed by word
   */
  async classifyUnknownWords(
    words: string[]
  ): Promise<Record<string, WordClassification>> {
    if (words.length === 0) return {};

    // Normalize and dedupe words
    const normalizedWords = [
      ...new Set(words.map((w) => w.toLowerCase().trim())),
    ];

    // Filter out words we already know
    const unknownWords = normalizedWords.filter((word) => {
      const known = this.isFood(word);
      return known === null; // Only classify truly unknown words
    });

    if (unknownWords.length === 0) {
      // All words are already known, return from cache
      const results: Record<string, WordClassification> = {};
      for (const word of normalizedWords) {
        const isFood = this.isFood(word);
        const category = this.getCategory(word);
        results[word] = {
          isFood: isFood === true,
          category,
          source: 'cached',
          confidence: 1,
        };
      }
      return results;
    }

    try {
      // Call backend to classify unknown words
      const apiResults = await classificationApi.classifyWords(unknownWords);

      // Convert API results to our type
      const classifications: Record<string, WordClassification> = {};
      for (const [word, result] of Object.entries(apiResults)) {
        classifications[word] = {
          isFood: result.isFood,
          category: result.category as FoodCategory | null,
          source: result.source,
          confidence: result.confidence,
        };
      }

      // Update store with new classifications
      const store = useClassificationStore.getState();
      store.updateFromClassifications(classifications);

      // Include already-known words in results
      for (const word of normalizedWords) {
        if (!classifications[word]) {
          const isFood = this.isFood(word);
          const category = this.getCategory(word);
          classifications[word] = {
            isFood: isFood === true,
            category,
            source: 'cached',
            confidence: 1,
          };
        }
      }

      return classifications;
    } catch (error) {
      console.error('Failed to classify words:', error);

      // Return empty results on error - words stay as unknown
      return {};
    }
  }

  /**
   * Send feedback on a classification (for improving accuracy).
   * @param word The word that was classified
   * @param accepted Whether the user accepted the classification
   */
  async sendFeedback(word: string, accepted: boolean): Promise<void> {
    try {
      await classificationApi.sendFeedback(word.toLowerCase().trim(), accepted);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      // Non-critical - don't throw
    }
  }

  /**
   * Reset the service and clear all cached data.
   */
  reset(): void {
    this.initialized = false;
    useClassificationStore.getState().reset();
  }
}

// Export singleton instance
export const foodClassificationService = new FoodClassificationService();
