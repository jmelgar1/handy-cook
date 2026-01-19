import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'food_words';

export const handler = async (event) => {
  try {
    const foodWords = {};
    const nonFoodWords = [];
    const genericWords = [];

    // Scan all items from the table
    const scanResult = await scanAllItems();

    for (const item of scanResult) {
      // Check if it's a generic word first
      if (item.isGeneric === true) {
        genericWords.push(item.word);
      } else if (item.isFood === true) {
        const cat = item.category || 'Other';
        if (!foodWords[cat]) foodWords[cat] = [];
        foodWords[cat].push(item.word);
      } else if (item.isFood === false) {
        nonFoodWords.push(item.word);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodWords,
        nonFoodWords,
        genericWords,
        version: new Date().toISOString().split('T')[0]
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function scanAllItems() {
  const items = [];
  let lastKey = undefined;

  do {
    const result = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastKey
    }));

    if (result.Items) {
      items.push(...result.Items.map(item => unmarshall(item)));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}