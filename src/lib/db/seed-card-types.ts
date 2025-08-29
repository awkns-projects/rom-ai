import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cardType } from './schema';
import { sql } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });

// Database connection
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is required');
}

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

export async function seedCardTypes() {
  try {
    console.log('Seeding card types...');

    const cardTypes = [
      {
        name: 'regular',
        displayName: 'Regular Card',
        description: 'Basic ROM card with 4 agent slots. Perfect for getting started with AI automation.',
        price: '5.00',
        maxSlots: 4,
        features: [
          '4 Agent Slots',
          'Basic Deployment',
          'Standard Support',
          'Monthly Usage Reports'
        ],
        isActive: true,
      },
      {
        name: 'marketplace',
        displayName: 'Marketplace Card',
        description: 'Enhanced ROM card with marketplace access and 6 agent slots. Share and discover agents.',
        price: '10.00',
        maxSlots: 6,
        features: [
          '6 Agent Slots',
          'Marketplace Access',
          'Agent Sharing',
          'Public Agent Discovery',
          'Enhanced Analytics',
          'Priority Support'
        ],
        isActive: true,
      },
      {
        name: 'publish',
        displayName: 'Publish Card',
        description: 'Professional ROM card with publishing capabilities and 8 agent slots. Monetize your agents.',
        price: '50.00',
        maxSlots: 8,
        features: [
          '8 Agent Slots',
          'Agent Publishing',
          'Revenue Sharing',
          'Advanced Analytics',
          'Custom Branding',
          'API Access',
          'Premium Support',
          'White-label Options'
        ],
        isActive: true,
      },
    ];

    // Insert card types
    for (const type of cardTypes) {
      await db
        .insert(cardType)
        .values(type)
        .onConflictDoNothing();
    }

    console.log('Card types seeded successfully!');
    
    // Verify insertion
    const insertedTypes = await db.select().from(cardType);
    console.log(`Total card types: ${insertedTypes.length}`);
    
  } catch (error) {
    console.error('Error seeding card types:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedCardTypes().catch(console.error);
} 