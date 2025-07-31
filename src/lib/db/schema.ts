import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  // Encrypted API keys for AI providers
  openaiApiKey: text('openaiApiKey'), // Encrypted OpenAI API key
  xaiApiKey: text('xaiApiKey'), // Encrypted xAI API key
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'image', 'sheet', 'agent'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    metadata: json('metadata'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
    }),
  }),
);

export const avatar = pgTable('Avatar', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  documentId: uuid('documentId'),
  name: varchar('name', { length: 255 }).notNull(),
  personality: text('personality'),
  characterNames: text('characterNames'),
  type: varchar('type', { length: 50 }).notNull().default('rom-unicorn'),
  romUnicornType: varchar('romUnicornType', { length: 50 }),
  customType: varchar('customType', { length: 50 }),
  uploadedImage: text('uploadedImage'),
  selectedStyle: varchar('selectedStyle', { length: 50 }),
  connectedWallet: varchar('connectedWallet', { length: 255 }),
  selectedNFT: varchar('selectedNFT', { length: 255 }),
  unicornParts: json('unicornParts'),
  isActive: boolean('isActive').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Avatar = InferSelectModel<typeof avatar>;

// OAuth connections table for secure token storage
export const oauthConnection = pgTable('OAuthConnection', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  documentId: uuid('documentId')
    .references(() => document.id),
  provider: varchar('provider', { 
    enum: ['instagram', 'facebook', 'shopify', 'threads', 'google', 'github-oauth', 'linkedin', 'notion'] 
  }).notNull(),
  providerUserId: varchar('providerUserId', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }),
  // Encrypted tokens
  accessToken: text('accessToken').notNull(), // Encrypted
  refreshToken: text('refreshToken'), // Encrypted
  encryptionIv: varchar('encryptionIv', { length: 32 }), // IV for encryption
  expiresAt: timestamp('expiresAt'),
  scopes: json('scopes'), // Array of granted scopes
  // Provider-specific data
  providerData: json('providerData'), // Store additional provider-specific info
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type OAuthConnection = InferSelectModel<typeof oauthConnection>;

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;
