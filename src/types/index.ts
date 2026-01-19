// User types
export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  achievements: Achievement[];
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
};

// Recipe types
export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  cuisine: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  isPublic: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type Ingredient = {
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
};

// Pantry types
export type PantryItem = {
  id: string;
  userId: string;
  name: string;
  quantity: string;
  unit?: string;
  category: FoodCategory;
  expiresAt?: string;
  addedVia: 'manual' | 'barcode' | 'image';
  barcode?: string;
  createdAt: string;
  updatedAt: string;
};

export type FoodCategory =
  | 'Dairy'
  | 'Vegetables'
  | 'Fruits'
  | 'Meat'
  | 'Seafood'
  | 'Pantry Staples'
  | 'Condiments'
  | 'Beverages'
  | 'Frozen'
  | 'Bakery'
  | 'Other';

// User recipe progress
export type UserRecipeProgress = {
  recipeId: string;
  isFavorite: boolean;
  unlockProgress: number;
  totalIngredients: number;
  unlockedAt?: string;
  notes?: string;
};

// Camera types
export type CameraMode = 'barcode' | 'photo' | 'video' | 'scan';

// Scan types
export type ScanResult = {
  type: 'barcode' | 'image';
  data: string;
  confidence?: number;
  product?: ScannedProduct;
};

export type ScannedProduct = {
  name: string;
  brand?: string;
  category?: FoodCategory;
  barcode?: string;
  imageUrl?: string;
};

// Re-export detection types
export * from './detection';

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  nextToken?: string;
  total?: number;
};
