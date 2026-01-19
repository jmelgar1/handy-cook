import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'food_words';

// USDA category mapping (expanded)
const USDA_CATEGORY_MAP = {
  // Standard categories
  'Dairy and Egg Products': 'Dairy',
  'Beef Products': 'Meat',
  'Pork Products': 'Meat',
  'Poultry Products': 'Meat',
  'Lamb, Veal, and Game Products': 'Meat',
  'Finfish and Shellfish Products': 'Seafood',
  'Fruits and Fruit Juices': 'Fruits',
  'Vegetables and Vegetable Products': 'Vegetables',
  'Baked Products': 'Bakery',
  'Cereal Grains and Pasta': 'Pantry Staples',
  'Beverages': 'Beverages',
  'Fats and Oils': 'Condiments',
  'Spices and Herbs': 'Condiments',
  'Legumes and Legume Products': 'Pantry Staples',
  'Nut and Seed Products': 'Pantry Staples',
  'Snacks': 'Pantry Staples',
  'Sweets': 'Pantry Staples',
  'Soups, Sauces, and Gravies': 'Condiments',
  'Baby Foods': 'Other',
  'Sausages and Luncheon Meats': 'Meat',

  // Branded food categories (what USDA actually returns)
  'Pre-Packaged Fruit & Vegetables': 'Fruits',
  'Other Grains & Seeds': 'Pantry Staples',
  'Frozen Fruits': 'Fruits',
  'Frozen Vegetables': 'Vegetables',
  'Fresh Vegetables': 'Vegetables',
  'Fresh Fruits': 'Fruits',
  'Canned Vegetables': 'Vegetables',
  'Canned Fruit': 'Fruits',
  'Cheese': 'Dairy',
  'Milk': 'Dairy',
  'Yogurt': 'Dairy',
  'Eggs': 'Dairy',
  'Butter & Margarine': 'Dairy',
  'Bread & Buns': 'Bakery',
  'Cookies & Biscuits': 'Bakery',
  'Crackers': 'Pantry Staples',
  'Pasta & Noodles': 'Pantry Staples',
  'Rice': 'Pantry Staples',
  'Cereal': 'Pantry Staples',
  'Candy': 'Pantry Staples',
  'Chocolate': 'Pantry Staples',
  'Ice Cream & Frozen Dairy': 'Frozen',
  'Frozen Meals': 'Frozen',
  'Frozen Pizza': 'Frozen',
  'Chips, Pretzels & Snacks': 'Pantry Staples',
  'Nuts & Seeds': 'Pantry Staples',
  'Dried Fruit': 'Pantry Staples',
  'Juice & Juice Drinks': 'Beverages',
  'Soft Drinks': 'Beverages',
  'Coffee': 'Beverages',
  'Tea': 'Beverages',
  'Water': 'Beverages',
  'Condiments & Sauces': 'Condiments',
  'Salad Dressing': 'Condiments',
  'Pickles & Relish': 'Condiments',
  'Meat': 'Meat',
  'Poultry': 'Meat',
  'Seafood': 'Seafood',
  'Deli Meat': 'Meat',
};

// Match score threshold - below this, word is considered non-food
const MATCH_THRESHOLD = 0.6;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const words = body.words || [];

    console.log(`[Classify] Incoming request: ${words.length} words`, JSON.stringify(words));

    if (!Array.isArray(words) || words.length === 0) {
      console.log('[Classify] Error: empty or invalid words array');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'words array is required' })
      };
    }

    const results = {};
    const stats = { cached: 0, usda: 0, usda_no_match: 0, usda_error: 0 };

    for (const word of words.slice(0, 20)) {
      const normalized = word.toLowerCase().trim();
      console.log(`\n[Classify] Processing: "${normalized}"`);

      // 1. Check DynamoDB cache first
      const cached = await getFromDynamo(normalized);
      if (cached) {
        console.log(`[Classify] Cache hit for "${normalized}": isFood=${cached.isFood}, category=${cached.category}`);
        results[normalized] = cached;
        stats.cached++;
        continue;
      }

      console.log(`[Classify] Cache miss for "${normalized}" - querying USDA Foundation foods`);

      // 2. Query USDA Foundation foods only
      const classification = await classifyWithUSDA(normalized);

      // Track stats
      if (classification.error) {
        stats.usda_error++;
      } else {
        stats[classification.source] = (stats[classification.source] || 0) + 1;
      }

      // 3. Store in DynamoDB for future lookups (skip errors - they should be retried)
      if (!classification.error) {
        await storeToDynamo(normalized, classification);
      }

      // 4. Format response
      results[normalized] = {
        isFood: classification.isFood,
        category: classification.category,
        source: classification.source,
        confidence: classification.confidence,
        usda: classification.usda || null
      };
    }

    console.log(`\n[Classify] Complete. Stats:`, JSON.stringify(stats));
    console.log(`[Classify] Results:`, JSON.stringify(results));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classifications: results })
    };
  } catch (error) {
    console.error('[Classify] Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getFromDynamo(word) {
  try {
    const result = await client.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `WORD#${word}`, SK: 'META' }
    }));

    if (result.Item) {
      const item = result.Item;
      // Handle legacy string booleans
      const isFood = item.isFood === true || item.isFood === 'true';

      const cached = {
        isFood,
        category: item.category,
        source: 'cached',
        confidence: item.confidence
      };

      // Include USDA metadata if available
      if (item.usdaFdcId) {
        cached.usda = {
          fdcId: item.usdaFdcId,
          description: item.usdaDescription,
          dataType: item.usdaDataType,
          foodCategory: item.usdaFoodCategory
        };
      } else {
        cached.usda = null;
      }

      return cached;
    }
    return null;
  } catch (error) {
    console.error('DynamoDB get error:', error);
    return null;
  }
}

async function storeToDynamo(word, classification) {
  try {
    const item = {
      PK: `WORD#${word}`,
      SK: 'META',
      word: word,
      isFood: classification.isFood, // Store as boolean
      category: classification.category,
      source: classification.source,
      confidence: classification.confidence,
      matchScore: classification.matchScore || null,
      detectionCount: 1,
      acceptanceCount: 0,
      rejectionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add USDA-specific fields if this is a food item
    if (classification.usda) {
      item.usdaFdcId = classification.usda.fdcId;
      item.usdaDescription = classification.usda.description;
      item.usdaDataType = classification.usda.dataType;
      item.usdaFoodCategory = classification.usda.foodCategory;
    }

    // Add USDA search metadata for non-food items
    if (!classification.isFood && classification.usdaResultCount !== undefined) {
      item.usdaSearched = true;
      item.usdaResultCount = classification.usdaResultCount;
    }

    // Add nutrients if available
    if (classification.nutrients) {
      item.nutrients = classification.nutrients;
    }

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    console.log(`[DynamoDB] Stored "${word}": isFood=${item.isFood}, category=${item.category}`);
  } catch (error) {
    console.error('DynamoDB put error:', error);
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the best matching food from USDA results using strict matching.
 *
 * IMPORTANT: Only matches where the search word IS the primary food (first word)
 * are considered valid. This prevents false positives where:
 * - "brown" matches "Rice, brown, long-grain" (brown is a modifier, not the food)
 * - "liquid" matches "Milk, whole, liquid" (liquid is a descriptor)
 * - "white" matches "Bread, white" (white is a modifier)
 *
 * USDA Foundation foods format: "PrimaryFood, modifier1, modifier2, ..."
 * We only match if the search word IS the primary food.
 *
 * @returns {{ match: object|null, score: number }}
 */
function findBestUSDAMatch(word, foods) {
  const wordLower = word.toLowerCase().trim();

  let bestMatch = null;
  let bestScore = 0;

  for (const food of foods) {
    const desc = (food.description || '').toLowerCase();
    let score = 0;

    // Extract the FIRST word only (the primary food in USDA format)
    const firstWord = desc.split(/[,\s]+/)[0];

    // Exact match (entire description equals the word)
    if (desc === wordLower) {
      score = 1.0;
    }
    // Description starts with word + delimiter (e.g., "apple, raw" for "apple")
    else if (desc.startsWith(wordLower + ',') || desc.startsWith(wordLower + ' ')) {
      score = 0.95;
    }
    // First word matches exactly (e.g., "apples" matches first word "apples")
    else if (firstWord === wordLower) {
      score = 0.9;
    }
    // Handle plurals: search word is plural of first word (e.g., "apples" for "apple,...")
    // or first word is plural of search word
    else if (
      wordLower === firstWord + 's' ||
      wordLower === firstWord + 'es' ||
      firstWord === wordLower + 's' ||
      firstWord === wordLower + 'es'
    ) {
      score = 0.85;
    }
    // First word starts with search word (e.g., "straw" matches "strawberries")
    // Only if search word is at least 4 chars to avoid false positives
    else if (wordLower.length >= 4 && firstWord.startsWith(wordLower)) {
      score = 0.7;
    }
    // No match - word is NOT the primary food
    else {
      continue; // Skip this food entirely
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  return { match: bestMatch, score: bestScore };
}

/**
 * Extract key nutrients from USDA food nutrients array
 */
function extractKeyNutrients(foodNutrients) {
  const nutrientMap = {
    1008: 'calories',   // Energy (kcal)
    1003: 'protein',    // Protein
    1005: 'carbs',      // Carbohydrates
    1004: 'fat',        // Total lipid (fat)
    1079: 'fiber'       // Fiber, total dietary
  };

  const nutrients = {};
  for (const n of foodNutrients || []) {
    const key = nutrientMap[n.nutrientId];
    if (key && n.value !== undefined) {
      nutrients[key] = n.value;
    }
  }

  return Object.keys(nutrients).length > 0 ? nutrients : null;
}

/**
 * Classify a word using USDA Foundation foods database only
 * @returns Classification result object (never null - always returns a result)
 */
async function classifyWithUSDA(word) {
  const wordLower = word.toLowerCase().trim();

  // Skip very short words (< 3 chars) - likely not meaningful food terms
  if (wordLower.length < 3) {
    console.log(`[USDA] Skipping "${word}" - too short (< 3 chars)`);
    return {
      isFood: false,
      category: null,
      source: 'usda_no_match',
      confidence: 0.8,
      matchScore: 0,
      usda: null,
      usdaResultCount: 0
    };
  }

  try {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      console.warn('[USDA] USDA_API_KEY not set');
      return { error: 'api_key_missing', isFood: null, source: 'usda_error' };
    }

    // Query USDA Foundation foods ONLY (strictest)
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(word)}&api_key=${apiKey}&pageSize=15&dataType=Foundation`;

    console.log(`[USDA] Request: query="${word}", dataType=Foundation, pageSize=15`);

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 429) {
        console.error(`[USDA] Rate limited for "${word}"`);
        return { error: 'rate_limited', isFood: null, source: 'usda_error' };
      }
      throw new Error(`USDA API error: ${res.status}`);
    }

    const data = await res.json();
    console.log(`[USDA] Response: totalHits=${data.totalHits || 0}, returned=${data.foods?.length || 0} foods`);

    // No results from USDA → mark as non-food
    if (!data.foods || data.foods.length === 0) {
      console.log(`[USDA] No results for "${word}" - marking as non-food`);
      return {
        isFood: false,
        category: null,
        source: 'usda_no_match',
        confidence: 0.7,
        matchScore: 0,
        usda: null,
        usdaResultCount: 0
      };
    }

    // Log top results for debugging
    const topResults = data.foods.slice(0, 3).map(f => ({
      description: f.description,
      category: f.foodCategory?.description || f.foodCategory || 'N/A',
      dataType: f.dataType
    }));
    console.log(`[USDA] Top results:`, JSON.stringify(topResults));

    // Find best match using score-based matching
    const { match, score } = findBestUSDAMatch(word, data.foods);

    // No good match found → mark as non-food
    if (!match || score < MATCH_THRESHOLD) {
      console.log(`[USDA] No good match for "${word}" (best score: ${score.toFixed(2)}) - marking as non-food`);
      // Higher confidence it's not food if we got results but none matched well
      const nonFoodConfidence = 0.7 + (0.2 * (1 - score));
      return {
        isFood: false,
        category: null,
        source: 'usda_no_match',
        confidence: Math.min(nonFoodConfidence, 0.9),
        matchScore: score,
        usda: null,
        usdaResultCount: data.foods.length
      };
    }

    // Good match found → it's a food!
    const usdaCategory = match.foodCategory?.description || match.foodCategory || '';
    const appCategory = USDA_CATEGORY_MAP[usdaCategory] || 'Other';

    // Extract key nutrients if available
    const nutrients = extractKeyNutrients(match.foodNutrients);

    console.log(`[USDA] Match: "${word}" -> "${match.description}" (score: ${score.toFixed(2)}, fdcId: ${match.fdcId})`);

    return {
      isFood: true,
      category: appCategory,
      source: 'usda',
      confidence: score,
      matchScore: score,
      usda: {
        fdcId: match.fdcId,
        description: match.description,
        dataType: match.dataType,
        foodCategory: usdaCategory
      },
      nutrients
    };
  } catch (error) {
    console.error(`[USDA] API error for "${word}":`, error.message);
    return { error: error.message, isFood: null, source: 'usda_error' };
  }
}

