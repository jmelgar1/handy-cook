/**
 * Seed data for food_words DynamoDB table
 * Extracted from src/services/visionResponseParser.ts
 */

// Food words organized by category
export const FOOD_WORDS = {
  Fruits: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
    'raspberry', 'blackberry', 'cherry', 'peach', 'pear', 'plum', 'mango', 'pineapple',
    'watermelon', 'melon', 'cantaloupe', 'kiwi', 'avocado', 'coconut', 'pomegranate',
    'fig', 'date', 'papaya', 'guava', 'passion fruit', 'dragon fruit', 'grapefruit',
    'cranberry'
  ],

  Vegetables: [
    'carrot', 'broccoli', 'cauliflower', 'spinach', 'lettuce', 'kale',
    'cabbage', 'celery', 'cucumber', 'tomato', 'potato', 'onion', 'garlic', 'ginger',
    'pepper', 'bell pepper', 'chili', 'jalapeno', 'corn', 'peas', 'beans', 'lentils',
    'asparagus', 'artichoke', 'beet', 'turnip', 'radish', 'zucchini', 'squash',
    'pumpkin', 'eggplant', 'mushroom', 'leek', 'scallion', 'shallot', 'bok choy'
  ],

  Meat: [
    'meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'bacon', 'ham',
    'sausage', 'steak', 'ground beef'
  ],

  Seafood: [
    'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'lobster', 'crab', 'oyster',
    'mussel', 'clam', 'scallop', 'seafood'
  ],

  Dairy: [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'cottage cheese',
    'mozzarella', 'cheddar', 'parmesan', 'brie', 'feta', 'gouda', 'swiss',
    'cream cheese', 'goat cheese'
  ],

  Bakery: [
    'bread', 'bagel', 'croissant', 'baguette', 'roll', 'bun', 'tortilla',
    'baked goods'
  ],

  'Pantry Staples': [
    'rice', 'pasta', 'noodle', 'cereal', 'oat', 'oats', 'oatmeal', 'wheat', 'flour',
    'grain', 'quinoa', 'barley', 'couscous', 'cracker', 'nut', 'almond', 'walnut',
    'cashew', 'peanut', 'pistachio', 'hazelnut', 'sugar'
  ],

  Condiments: [
    'sauce', 'ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'vinegar', 'oil',
    'olive oil', 'dressing', 'salsa', 'hot sauce', 'barbecue', 'honey', 'syrup',
    'jam', 'jelly', 'peanut butter', 'nutella', 'spread', 'maple syrup',
    'coconut oil', 'vegetable oil', 'canola oil', 'sesame oil'
  ],

  Beverages: [
    'juice', 'coffee', 'tea', 'soda', 'water', 'wine', 'beer', 'smoothie',
    'orange juice', 'apple juice', 'grape juice'
  ],

  Proteins: [
    'egg', 'tofu', 'tempeh', 'seitan'
  ],

  'Snacks & Sweets': [
    'chocolate', 'candy', 'cookie', 'cake', 'pie', 'ice cream', 'chips', 'popcorn',
    'pretzel', 'snack'
  ],

  Other: [
    'soup', 'broth', 'stock'
  ]
};

// Non-food items to exclude
export const NON_FOOD_ITEMS = [
  // Environment & Surfaces
  'floor', 'flooring', 'tile', 'wood', 'hardwood', 'laminate', 'carpet', 'rug',
  'wall', 'ceiling', 'door', 'window', 'glass', 'mirror',
  // Furniture & Fixtures
  'cabinet', 'cupboard', 'drawer', 'shelf', 'counter', 'countertop', 'table',
  'chair', 'stool', 'furniture', 'appliance', 'refrigerator', 'fridge', 'oven',
  'stove', 'microwave', 'dishwasher', 'sink',
  // Body parts
  'hand', 'finger', 'arm', 'skin', 'face', 'person', 'human', 'body', 'thumb',
  'palm', 'wrist', 'nail', 'foot', 'leg',
  // Household items
  'bag', 'plastic bag', 'paper', 'towel', 'cloth', 'fabric', 'textile',
  'container', 'tray', 'rack', 'basket', 'bin', 'trash',
  // Materials & Textures
  'metal', 'steel', 'iron', 'aluminum', 'plastic', 'rubber', 'leather',
  'granite', 'marble', 'concrete', 'brick', 'stone',
  // Electronics
  'phone', 'camera', 'screen', 'device', 'light', 'lighting', 'lamp',
  // Abstract/Generic
  'indoor', 'room', 'kitchen', 'interior', 'design', 'pattern', 'texture',
  'color', 'shadow', 'reflection', 'background'
];

// Generic labels that are too vague to be useful
export const GENERIC_LABELS = [
  // Container/packaging types
  'bottle', 'box', 'can', 'jar', 'package',
  'boxed packaged goods', 'bottled and jarred packaged goods',
  'bagged packaged goods',
  // Generic categories
  'food', 'ingredient', 'produce', 'grocery',
  'food group', 'food storage', 'food preservation',
  'frozen food', 'natural foods', 'convenience food',
  'staple food', 'fast food', 'comfort food',
  'recipe', 'meal', 'dish',
  // Kitchenware that sometimes passes
  'dishware', 'drinkware', 'drink can', 'serveware',
  // Attributes, not items
  'organic', 'natural', 'fresh', 'gluten', 'free',
  'vegetable', 'fruit'
];

// Food modifiers (used in compound names like "olive oil")
export const FOOD_MODIFIERS = [
  'olive', 'coconut', 'avocado', 'vegetable', 'canola', 'sesame', 'sunflower',
  'maple', 'chocolate', 'almond', 'oat', 'soy', 'whole', 'skim', 'lowfat', 'nonfat',
  'brown', 'red', 'chickpea', 'white', 'instant', 'rolled', 'steel',
  'ground', 'grilled', 'roasted', 'smoked', 'sliced',
  'greek', 'ice', 'hot'
];

// Food base words (can be standalone or modified)
export const FOOD_BASES = [
  'oil', 'milk', 'pasta', 'syrup', 'butter', 'cheese', 'cream', 'yogurt',
  'juice', 'sauce', 'oats', 'oatmeal', 'rice', 'bread', 'flour'
];

// Product forms (like "beef patties")
export const FOOD_FORMS = [
  'bars', 'bar', 'patties', 'patty', 'breast', 'strips', 'nuggets', 'wings',
  'sticks', 'bites', 'chunks', 'slices', 'cubes', 'loaf'
];
