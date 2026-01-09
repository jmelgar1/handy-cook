import type { ScannedProduct, FoodCategory, ApiResponse } from '../types';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  code?: string;
};

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

/**
 * Maps Open Food Facts categories to our FoodCategory type
 */
function mapCategory(categories?: string): FoodCategory {
  if (!categories) return 'Other';

  const lowerCategories = categories.toLowerCase();

  if (lowerCategories.includes('dairy') || lowerCategories.includes('milk') || lowerCategories.includes('cheese')) {
    return 'Dairy';
  }
  if (lowerCategories.includes('vegetable')) {
    return 'Vegetables';
  }
  if (lowerCategories.includes('fruit')) {
    return 'Fruits';
  }
  if (lowerCategories.includes('meat') || lowerCategories.includes('chicken') || lowerCategories.includes('beef')) {
    return 'Meat';
  }
  if (lowerCategories.includes('seafood') || lowerCategories.includes('fish')) {
    return 'Seafood';
  }
  if (lowerCategories.includes('frozen')) {
    return 'Frozen';
  }
  if (lowerCategories.includes('bread') || lowerCategories.includes('bakery')) {
    return 'Bakery';
  }
  if (lowerCategories.includes('beverage') || lowerCategories.includes('drink')) {
    return 'Beverages';
  }
  if (lowerCategories.includes('sauce') || lowerCategories.includes('condiment')) {
    return 'Condiments';
  }

  return 'Pantry Staples';
}

export const barcodeService = {
  /**
   * Look up a barcode using Open Food Facts API
   */
  lookupBarcode: async (barcode: string): Promise<ApiResponse<ScannedProduct>> => {
    try {
      const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);
      const data: OpenFoodFactsResponse = await response.json();

      if (data.status !== 1 || !data.product) {
        // Fall back to our API for additional lookup
        return await barcodeService.lookupFromBackend(barcode);
      }

      const product: ScannedProduct = {
        name: data.product.product_name || 'Unknown Product',
        brand: data.product.brands,
        category: mapCategory(data.product.categories),
        barcode: data.product.code || barcode,
        imageUrl: data.product.image_url,
      };

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return await barcodeService.lookupFromBackend(barcode);
    }
  },

  /**
   * Fall back to our backend API for barcode lookup
   */
  lookupFromBackend: async (barcode: string): Promise<ApiResponse<ScannedProduct>> => {
    try {
      // This would call our Lambda function
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/scan/barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      return {
        success: true,
        data: data.product,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to lookup barcode',
      };
    }
  },

  /**
   * Cache successful barcode lookups locally
   */
  cacheProduct: async (barcode: string, product: ScannedProduct): Promise<void> => {
    // TODO: Implement local caching with MMKV
  },

  /**
   * Get cached product by barcode
   */
  getCachedProduct: async (barcode: string): Promise<ScannedProduct | null> => {
    // TODO: Implement local cache retrieval
    return null;
  },
};
