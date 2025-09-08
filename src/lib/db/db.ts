import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection
const connectionString = process.env.POSTGRES_URL!;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

// Create the connection
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for better compatibility
});

// Create the database instance with schema
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };

// Type for the database instance
export type Database = typeof db; 