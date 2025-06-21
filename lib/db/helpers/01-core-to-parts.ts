import { config } from 'dotenv';
import postgres from 'postgres';
import {
  chat,
  message,
  vote,
} from '../schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { inArray } from 'drizzle-orm';
import { appendResponseMessages, type UIMessage } from 'ai';

config({
  path: '.env.local',
});

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

const BATCH_SIZE = 100; // Process 100 chats at a time
const INSERT_BATCH_SIZE = 1000; // Insert 1000 messages at a time

type NewMessageInsert = {
  id: string;
  chatId: string;
  parts: any[];
  role: string;
  attachments: any[];
  createdAt: Date;
};

type NewVoteInsert = {
  messageId: string;
  chatId: string;
  isUpvoted: boolean;
};

// This migration helper is no longer needed since we've removed the deprecated tables
// The migration logic below would need to be updated if you still need to migrate data
// from old tables to new ones, but since we're removing the deprecated tables entirely,
// this file can be simplified or removed.

console.log('Migration helper: Deprecated tables have been removed from schema.');
console.log('If you need to migrate existing data, please update this file accordingly.');

export {};
