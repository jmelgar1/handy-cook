import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'food_words';

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { word, accepted } = body;

    if (!word) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'word is required' })
      };
    }

    const normalized = word.toLowerCase().trim();

    // Update counters in DynamoDB
    await client.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `WORD#${normalized}`, SK: 'META' },
      UpdateExpression: accepted
        ? 'ADD acceptanceCount :inc SET updatedAt = :now'
        : 'ADD rejectionCount :inc SET updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
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