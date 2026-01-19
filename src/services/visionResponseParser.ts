import type { VisionAPIResponse, RawDetection } from '../types';
import { foodClassificationService } from './foodClassificationService';
import { correctionApi } from './api';

// Buffer to collect unknown words during parsing
let unknownWordsBuffer: string[] = [];

/**
 * Get and clear the buffer of unknown words that were encountered during parsing.
 * Call this after parseVisionResponse to get words that need backend classification.
 */
export function getAndClearUnknownWords(): string[] {
  const words = [...unknownWordsBuffer];
  unknownWordsBuffer = [];
  return words;
}

// Minimum confidence threshold for keeping detections (50%)
const MIN_CONFIDENCE_THRESHOLD = 0.50;

/**
 * Check if a label is food-related and specific enough to be useful.
 * Uses dynamic classification service (requires network connection).
 *
 * @returns true (food), false (not food), or 'pending' (unknown, needs backend classification)
 */
function isFoodRelated(label: string): boolean | 'pending' {
  const normalized = label.toLowerCase().trim();

  // Check if it's generic according to backend cache
  if (foodClassificationService.isGeneric(normalized)) {
    return false;
  }

  // Check known classification from backend cache
  const isFood = foodClassificationService.isFood(normalized);
  if (isFood === true) {
    return true;
  }
  if (isFood === false) {
    return false;
  }

  // Unknown - add to buffer for later classification and return 'pending'
  if (!unknownWordsBuffer.includes(normalized)) {
    unknownWordsBuffer.push(normalized);
  }
  return 'pending';
}

/**
 * Parse Vision API response into detected items
 * Filters to only include food-related detections
 * Uses LLM for OCR text correction
 */
export async function parseVisionResponse(response: VisionAPIResponse): Promise<RawDetection[]> {
  const items: RawDetection[] = [];
  const responseData = response.responses?.[0];

  console.log('\n========== VISION API RESPONSE ==========');

  if (!responseData) {
    console.log('[Vision] No response data received');
    return items;
  }

  // Collect logo texts for LLM context (helps identify brand names)
  const logoTexts = responseData.logoAnnotations?.map(l => l.description) || [];

  // 1. Logo detections - SKIPPED (logos are brand names, not food items)
  // We want food items like "Olive Oil", not brand names like "Bob's Red Mill"
  if (responseData.logoAnnotations && responseData.logoAnnotations.length > 0) {
    console.log('\n--- LOGO DETECTIONS (skipped - brand names) ---');
    responseData.logoAnnotations.forEach((logo) => {
      console.log(`[Logo] "${logo.description}" (${(logo.score * 100).toFixed(1)}%) ❌ SKIPPED (brand name)`);
    });
  }

  // 2. OCR text from packaging - use LLM for intelligent extraction
  if (responseData.textAnnotations && responseData.textAnnotations.length > 0) {
    console.log('\n--- OCR TEXT ---');
    const fullText = responseData.textAnnotations[0].description;
    // Log first 200 chars of raw OCR text
    console.log(`[OCR Raw] "${fullText.substring(0, 200).replace(/\n/g, ' ')}${fullText.length > 200 ? '...' : ''}"`);

    // Call LLM endpoint for intelligent OCR correction
    try {
      console.log('[OCR] Calling LLM for correction...');
      const corrected = await correctionApi.correctOCR({
        ocrText: fullText,
        logoTexts: logoTexts.length > 0 ? logoTexts : undefined,
      });

      // Log what LLM returned
      console.log(`[OCR LLM] Response (${corrected.source}, ${corrected.processingTime}ms)`);
      if (corrected.brandName) {
        console.log(`[OCR LLM] Brand: "${corrected.brandName}"`);
      }
      if (corrected.productName) {
        console.log(`[OCR LLM] Product: "${corrected.productName}"`);
      }
      if (corrected.foodTerms && corrected.foodTerms.length > 0) {
        console.log(`[OCR LLM] Food terms: ${corrected.foodTerms.map(t => t.term).join(', ')}`);
      }

      // If we have a product name, use it (with brand if available)
      // Skip individual food terms when product name is present
      if (corrected.productName) {
        const label = corrected.brandName
          ? `${corrected.brandName} - ${corrected.productName}`
          : corrected.productName;

        // Use the highest confidence from food terms, or default to 0.9
        const confidence = corrected.foodTerms && corrected.foodTerms.length > 0
          ? Math.max(...corrected.foodTerms.map(t => t.confidence))
          : 0.9;

        // Use the first food term's category if available
        const category = corrected.foodTerms?.[0]?.category;

        console.log(`[OCR LLM] Adding product: "${label}" (${(confidence * 100).toFixed(0)}%) -> ${category || 'unknown'}`);
        items.push({
          label,
          confidence,
          source: 'ocr',
          category,
          boundingBox: responseData.textAnnotations[0].boundingPoly,
        });
      } else if (corrected.foodTerms && corrected.foodTerms.length > 0) {
        // No product name - fall back to individual food terms
        for (const foodTerm of corrected.foodTerms) {
          console.log(`[OCR LLM] "${foodTerm.term}" (${(foodTerm.confidence * 100).toFixed(0)}%) -> ${foodTerm.category}`);
          items.push({
            label: foodTerm.term,
            confidence: foodTerm.confidence,
            source: 'ocr',
            category: foodTerm.category,
            boundingBox: responseData.textAnnotations[0].boundingPoly,
          });
        }
      } else {
        console.log('[OCR LLM] No product name or food terms extracted');
      }
    } catch (error) {
      console.error('[OCR] LLM correction failed:', error);
      console.log('[OCR] Skipping OCR items due to LLM error');
    }
  }

  // 3. Label annotations (filtered for food-related only, with confidence threshold)
  if (responseData.labelAnnotations && responseData.labelAnnotations.length > 0) {
    console.log('\n--- LABEL ANNOTATIONS ---');
    responseData.labelAnnotations.forEach((label) => {
      const foodStatus = isFoodRelated(label.description);
      const meetsThreshold = label.score >= MIN_CONFIDENCE_THRESHOLD;

      let status = '❌ FILTERED';
      if (!meetsThreshold) {
        status = '❌ FILTERED (low confidence)';
      } else if (foodStatus === true) {
        status = '✅ KEPT';
      } else if (foodStatus === 'pending') {
        status = '⏳ PENDING (unknown)';
      }
      console.log(`[Label] "${label.description}" (${(label.score * 100).toFixed(1)}%) ${status}`);

      if (meetsThreshold && (foodStatus === true || foodStatus === 'pending')) {
        const category = foodStatus === true ? foodClassificationService.getCategory(label.description.toLowerCase()) : undefined;
        items.push({
          label: label.description,
          confidence: label.score,
          source: 'label',
          isPending: foodStatus === 'pending',
          category: category || undefined,
        });
      }
    });
  }

  // 4. Object localizations (filtered for food-related only, with confidence threshold)
  if (responseData.localizedObjectAnnotations && responseData.localizedObjectAnnotations.length > 0) {
    console.log('\n--- OBJECT LOCALIZATIONS ---');
    responseData.localizedObjectAnnotations.forEach((obj) => {
      const foodStatus = isFoodRelated(obj.name);
      const meetsThreshold = obj.score >= MIN_CONFIDENCE_THRESHOLD;

      let status = '❌ FILTERED';
      if (!meetsThreshold) {
        status = '❌ FILTERED (low confidence)';
      } else if (foodStatus === true) {
        status = '✅ KEPT';
      } else if (foodStatus === 'pending') {
        status = '⏳ PENDING (unknown)';
      }
      console.log(`[Object] "${obj.name}" (${(obj.score * 100).toFixed(1)}%) ${status}`);

      if (meetsThreshold && (foodStatus === true || foodStatus === 'pending')) {
        const category = foodStatus === true ? foodClassificationService.getCategory(obj.name.toLowerCase()) : undefined;
        items.push({
          label: obj.name,
          confidence: obj.score,
          source: 'object',
          boundingBox: obj.boundingPoly,
          isPending: foodStatus === 'pending',
          category: category || undefined,
        });
      }
    });
  }

  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Total items kept: ${items.length}`);
  if (items.length > 0) {
    console.log(`Kept: ${items.map(i => i.label).join(', ')}`);
  }
  console.log('==========================================\n');

  return items;
}

/**
 * Get a summary of detection counts by source type
 */
export function getDetectionSummary(items: RawDetection[]): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
