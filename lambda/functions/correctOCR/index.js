import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'food_words';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Initialize Anthropic client lazily
let anthropic = null;
function getAnthropicClient() {
  if (!anthropic && ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return anthropic;
}

// Category hints for the LLM
const CATEGORY_HINTS = [
  'Fruits', 'Vegetables', 'Meat', 'Seafood', 'Dairy',
  'Bakery', 'Pantry Staples', 'Condiments', 'Beverages', 'Frozen', 'Other'
];

export const handler = async (event) => {
  const startTime = Date.now();

  try {
    const body = JSON.parse(event.body || '{}');
    const { ocrText, logoTexts = [] } = body;

    console.log(`[CorrectOCR] Incoming request: ocrText length=${ocrText?.length || 0}, logos=${logoTexts.length}`);

    if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ocrText is required' })
      };
    }

    // Generate cache key from normalized OCR text
    const cacheKey = generateCacheKey(ocrText);
    console.log(`[CorrectOCR] Cache key: ${cacheKey}`);

    // 1. Check DynamoDB cache first
    const cached = await getCachedCorrection(cacheKey);
    if (cached) {
      console.log(`[CorrectOCR] Cache HIT - returning cached result`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cached,
          cached: true,
          source: 'cache',
          processingTime: Date.now() - startTime
        })
      };
    }

    console.log(`[CorrectOCR] Cache MISS - calling LLM`);

    // 2. Call LLM for correction
    const llmResult = await correctWithLLM(ocrText, logoTexts);

    if (llmResult) {
      // 3. Cache the result
      await cacheCorrection(cacheKey, ocrText, llmResult);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...llmResult,
          cached: false,
          source: 'llm',
          processingTime: Date.now() - startTime
        })
      };
    }

    // 4. Fallback if LLM fails
    console.log(`[CorrectOCR] LLM failed - using fallback`);
    const fallbackResult = extractFallbackTerms(ocrText);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fallbackResult,
        cached: false,
        source: 'fallback',
        processingTime: Date.now() - startTime
      })
    };

  } catch (error) {
    console.error('[CorrectOCR] Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Generate a cache key from OCR text
 * Normalizes text to handle minor variations
 */
function generateCacheKey(ocrText) {
  const normalized = ocrText
    .toLowerCase()
    .replace(/[\r\n]+/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .sort()
    .join('\n');

  return createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Get cached correction from DynamoDB
 */
async function getCachedCorrection(cacheKey) {
  try {
    const result = await client.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `OCR#${cacheKey}`, SK: 'CORRECTION' }
    }));

    if (result.Item) {
      return {
        foodTerms: result.Item.foodTerms || [],
        brandName: result.Item.brandName || null,
        productName: result.Item.productName || null
      };
    }
    return null;
  } catch (error) {
    console.error('[CorrectOCR] DynamoDB get error:', error);
    return null;
  }
}

/**
 * Cache correction result in DynamoDB
 */
async function cacheCorrection(cacheKey, ocrText, result) {
  try {
    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `OCR#${cacheKey}`,
        SK: 'CORRECTION',
        inputHash: cacheKey,
        ocrText: ocrText.substring(0, 1000), // Limit stored text
        foodTerms: result.foodTerms,
        brandName: result.brandName || null,
        productName: result.productName || null,
        llmModel: 'claude-3-haiku-20240307',
        tokensUsed: result.tokensUsed || 0,
        createdAt: new Date().toISOString()
      }
    }));
    console.log(`[CorrectOCR] Cached result for key: ${cacheKey}`);
  } catch (error) {
    console.error('[CorrectOCR] DynamoDB put error:', error);
  }
}

/**
 * Call Claude Haiku to correct OCR text
 */
async function correctWithLLM(ocrText, logoTexts) {
  const anthropicClient = getAnthropicClient();

  if (!anthropicClient) {
    console.error('[CorrectOCR] Anthropic client not configured');
    return null;
  }

  const systemPrompt = `You are a food package text parser. Given OCR text from a scanned food package:

1. RECONSTRUCT: Group fragmented words into complete product/ingredient names
2. CORRECT: Fix common OCR typos (ll→li, rn→m, 0→o, 1→l, etc.)
3. SEPARATE: Identify brand name vs actual food items
4. EXTRACT: Return only food terms, not marketing claims

Rules:
- Fix obvious typos using food vocabulary knowledge
- Ignore: UPC codes, weights, percentages, dates, addresses, nutrition facts
- Return max 5 food terms, most specific first
- Use these categories: ${CATEGORY_HINTS.join(', ')}

Return ONLY valid JSON (no markdown, no explanation):
{"brandName": "string or null", "productName": "corrected full product name or null", "foodTerms": [{"term": "food item", "confidence": 0.0-1.0, "category": "category from list"}]}`;

  const userPrompt = logoTexts.length > 0
    ? `OCR Text:\n${ocrText}\n\nDetected logos (likely brand names): ${logoTexts.join(', ')}`
    : `OCR Text:\n${ocrText}`;

  try {
    console.log(`[CorrectOCR] Calling Claude Haiku...`);
    console.log(`[CorrectOCR] User prompt:\n${userPrompt}`);

    const response = await anthropicClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });

    const content = response.content[0]?.text;
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    console.log(`[CorrectOCR] LLM raw response (${tokensUsed} tokens):`);
    console.log(content);

    if (!content) {
      console.error('[CorrectOCR] Empty LLM response');
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate structure
    if (!parsed.foodTerms || !Array.isArray(parsed.foodTerms)) {
      console.error('[CorrectOCR] Invalid LLM response structure');
      return null;
    }

    // Normalize food terms
    const foodTerms = parsed.foodTerms
      .filter(t => t.term && typeof t.term === 'string')
      .map(t => ({
        term: t.term.toLowerCase().trim(),
        confidence: typeof t.confidence === 'number' ? t.confidence : 0.8,
        category: CATEGORY_HINTS.includes(t.category) ? t.category : 'Other'
      }))
      .slice(0, 5);

    console.log(`[CorrectOCR] Extracted ${foodTerms.length} food terms:`, foodTerms.map(t => t.term));

    return {
      foodTerms,
      brandName: parsed.brandName || null,
      productName: parsed.productName || null,
      tokensUsed
    };

  } catch (error) {
    console.error('[CorrectOCR] LLM error:', error.message);
    return null;
  }
}

/**
 * Fallback extraction when LLM fails
 * Simple word extraction - better than nothing
 */
function extractFallbackTerms(ocrText) {
  // Common food-related words to look for
  const commonFoods = new Set([
    'milk', 'bread', 'cheese', 'butter', 'eggs', 'chicken', 'beef', 'pork',
    'rice', 'pasta', 'cereal', 'oats', 'yogurt', 'juice', 'water', 'coffee',
    'tea', 'sugar', 'salt', 'flour', 'oil', 'sauce', 'soup', 'beans', 'corn',
    'apple', 'banana', 'orange', 'tomato', 'potato', 'onion', 'carrot'
  ]);

  const words = ocrText
    .toLowerCase()
    .split(/[\s\n,;:]+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 2);

  const foundFoods = words
    .filter(w => commonFoods.has(w))
    .slice(0, 3);

  return {
    foodTerms: foundFoods.map(term => ({
      term,
      confidence: 0.3,
      category: 'Other'
    })),
    brandName: null,
    productName: null
  };
}
