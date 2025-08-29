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
  decimal,
  integer,
  unique,
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

export type ChatWithAvatar = Chat & {
  avatar: Avatar | null;
};

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

export const document = pgTable('Document', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
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
});

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId')
      .notNull()
      .references(() => document.id),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
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

// Card Types Table
export const cardType = pgTable('CardType', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(), // 'regular', 'marketplace', 'publish'
  displayName: varchar('displayName', { length: 100 }).notNull(), // 'Regular Card', 'Marketplace Card', 'Publish Card'
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // $5.00, $10.00, $50.00
  maxSlots: integer('maxSlots').notNull().default(4), // Number of agent slots
  features: json('features'), // JSON array of features
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type CardType = InferSelectModel<typeof cardType>;

// ROM Cards Table
export const romCard = pgTable('RomCard', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  cardTypeId: uuid('cardTypeId')
    .notNull()
    .references(() => cardType.id),
  name: varchar('name', { length: 100 }).notNull(),
  isDeployed: boolean('isDeployed').notNull().default(false),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('0.00'),
  totalSpent: decimal('totalSpent', { precision: 10, scale: 2 }).notNull().default('0.00'),
  lastUsed: timestamp('lastUsed'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type RomCard = InferSelectModel<typeof romCard>;

// Card Slots Table (for tracking which agents are in which slots)
export const cardSlot = pgTable('CardSlot', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  romCardId: uuid('romCardId')
    .notNull()
    .references(() => romCard.id, { onDelete: 'cascade' }),
  slotNumber: integer('slotNumber').notNull(), // 1, 2, 3, 4
  agentId: uuid('agentId') // Reference to chat.id (the agent)
    .references(() => chat.id, { onDelete: 'set null' }),
  isActive: boolean('isActive').notNull().default(false),
  startTime: timestamp('startTime'),
  endTime: timestamp('endTime'),
  totalCost: decimal('totalCost', { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type CardSlot = InferSelectModel<typeof cardSlot>;

// Orders Table
export const order = pgTable('Order', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  cardTypeId: uuid('cardTypeId')
    .notNull()
    .references(() => cardType.id),
  status: varchar('status', { enum: ['pending', 'completed', 'failed', 'refunded'] })
    .notNull()
    .default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentMethod: varchar('paymentMethod', { length: 50 }), // 'stripe', 'paypal', etc.
  paymentIntentId: varchar('paymentIntentId', { length: 255 }), // Stripe payment intent ID
  metadata: json('metadata'), // Additional order data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Order = InferSelectModel<typeof order>;

// Order Items Table (for tracking what was purchased)
export const orderItem = pgTable('OrderItem', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  orderId: uuid('orderId')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  romCardId: uuid('romCardId') // Reference to the created ROM card
    .references(() => romCard.id, { onDelete: 'set null' }),
  cardTypeId: uuid('cardTypeId')
    .notNull()
    .references(() => cardType.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('totalPrice', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type OrderItem = InferSelectModel<typeof orderItem>;
