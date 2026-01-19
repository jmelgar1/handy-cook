/**
 * Seed script for food_words DynamoDB table
 * Run with: node scripts/seedDatabase.js
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  FOOD_WORDS,
  NON_FOOD_ITEMS,
  GENERIC_LABELS,
  FOOD_MODIFIERS,
  FOOD_BASES,
  FOOD_FORMS
} from './seedData.js';

// Configuration
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'food_words_dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const BATCH_SIZE = 25; // DynamoDB limit

// Initialize DynamoDB client
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

/**
 * Create a DynamoDB item for a word
 */
function createItem(word, isFood, category = null, isGeneric = false) {
  const normalized = word.toLowerCase().trim();
  const now = new Date().toISOString();

  return {
    PutRequest: {
      Item: {
        PK: `WORD#${normalized}`,
        SK: 'META',
        word: normalized,
        isFood,
        category,
        isGeneric,
        source: 'seed',
        confidence: 1.0,
        detectionCount: 0,
        acceptanceCount: 0,
        rejectionCount: 0,
        createdAt: now,
        updatedAt: now
      }
    }
  };
}

/**
 * Batch write items to DynamoDB
 */
async function batchWrite(items) {
  const batches = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  let totalWritten = 0;
  for (const batch of batches) {
    try {
      await client.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch
        }
      }));
      totalWritten += batch.length;
      process.stdout.write(`\rWritten: ${totalWritten}/${items.length}`);
    } catch (error) {
      console.error(`\nError writing batch:`, error.message);
      throw error;
    }
  }
  console.log(); // New line after progress
  return totalWritten;
}

/**
 * Main seed function
 */
async function seed() {
  console.log('='.repeat(50));
  console.log('Seeding DynamoDB table:', TABLE_NAME);
  console.log('Region:', REGION);
  console.log('='.repeat(50));

  const items = [];
  const wordSet = new Set(); // Track unique words

  // 1. Add food words by category
  console.log('\n[1/4] Processing food words by category...');
  for (const [category, words] of Object.entries(FOOD_WORDS)) {
    for (const word of words) {
      const normalized = word.toLowerCase().trim();
      if (!wordSet.has(normalized)) {
        wordSet.add(normalized);
        items.push(createItem(word, true, category, false));
      }
    }
    console.log(`  - ${category}: ${words.length} words`);
  }

  // 2. Add food modifiers as foods (they can also be standalone)
  console.log('\n[2/4] Processing food modifiers...');
  let modifiersAdded = 0;
  for (const word of FOOD_MODIFIERS) {
    const normalized = word.toLowerCase().trim();
    if (!wordSet.has(normalized)) {
      wordSet.add(normalized);
      items.push(createItem(word, true, 'Other', false));
      modifiersAdded++;
    }
  }
  console.log(`  - Added ${modifiersAdded} unique modifiers`);

  // 3. Add non-food items
  console.log('\n[3/4] Processing non-food items...');
  let nonFoodAdded = 0;
  for (const word of NON_FOOD_ITEMS) {
    const normalized = word.toLowerCase().trim();
    if (!wordSet.has(normalized)) {
      wordSet.add(normalized);
      items.push(createItem(word, false, null, false));
      nonFoodAdded++;
    }
  }
  console.log(`  - Added ${nonFoodAdded} non-food items`);

  // 4. Add generic labels
  console.log('\n[4/4] Processing generic labels...');
  let genericAdded = 0;
  for (const word of GENERIC_LABELS) {
    const normalized = word.toLowerCase().trim();
    if (!wordSet.has(normalized)) {
      wordSet.add(normalized);
      items.push(createItem(word, false, null, true));
      genericAdded++;
    }
  }
  console.log(`  - Added ${genericAdded} generic labels`);

  // Summary before write
  console.log('\n' + '-'.repeat(50));
  console.log('Summary:');
  console.log(`  Total unique words: ${items.length}`);
  console.log(`  Batches to write: ${Math.ceil(items.length / BATCH_SIZE)}`);
  console.log('-'.repeat(50));

  // Write to DynamoDB
  console.log('\nWriting to DynamoDB...');
  const written = await batchWrite(items);

  console.log('\n' + '='.repeat(50));
  console.log('Seeding complete!');
  console.log(`  Items written: ${written}`);
  console.log('='.repeat(50));
}

// Run the seed
seed().catch((error) => {
  console.error('\nFailed to seed database:', error);
  process.exit(1);
});
