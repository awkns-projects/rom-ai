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

// ==================== EXISTING CORE TABLES ====================

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  privyId: text('privyId').unique(), // Privy user ID (did:privy:...)
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

// ==================== TOURNAMENT EXTENSION TABLES ====================

// Seasons Table
export const season = pgTable('Season', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate').notNull(),
  status: varchar('status', {
    enum: ['upcoming', 'active', 'review', 'complete', 'ended']
  }).notNull().default('upcoming'),
  theme: varchar('theme', { length: 100 }).notNull(),
  image: text('image').notNull(), // URL to season image
  totalPrizePool: decimal('totalPrizePool', { precision: 12, scale: 2 }).notNull().default('0.00'),
  participantCount: integer('participantCount').notNull().default(0),
  missionCount: integer('missionCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Season = InferSelectModel<typeof season>;

// Season Prizes Table
export const seasonPrize = pgTable('SeasonPrize', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(), // 1, 2, 3, etc.
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', {
    enum: ['cash', 'credits', 'nft', 'merchandise', 'access']
  }).notNull(),
  icon: varchar('icon', { length: 10 }).notNull(), // Emoji icon
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type SeasonPrize = InferSelectModel<typeof seasonPrize>;

// User Tournament Profile (extends base user with tournament-specific data)
export const userTournamentProfile = pgTable('UserTournamentProfile', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  avatar: varchar('avatar', { length: 10 }).notNull().default('🧑‍💻'), // Emoji avatar
  totalPoints: integer('totalPoints').notNull().default(0),
  level: integer('level').notNull().default(1),
  badge: varchar('badge', { length: 100 }).notNull().default('Newcomer'),
  joinDate: timestamp('joinDate').notNull().defaultNow(),
  solvedMissions: integer('solvedMissions').notNull().default(0),
  submittedMissions: integer('submittedMissions').notNull().default(0),
  currentStreak: integer('currentStreak').notNull().default(0),
  longestStreak: integer('longestStreak').notNull().default(0),
  lastActivityDate: timestamp('lastActivityDate'),
  isOnline: boolean('isOnline').notNull().default(false),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 100 }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type UserTournamentProfile = InferSelectModel<typeof userTournamentProfile>;

// Missions Table
export const mission = pgTable('Mission', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', {
    enum: ['technical', 'business', 'creative', 'research', 'other']
  }).notNull(),
  difficulty: varchar('difficulty', {
    enum: ['easy', 'medium', 'hard', 'expert']
  }).notNull(),
  points: integer('points').notNull(),
  status: varchar('status', {
    enum: ['open', 'in-progress', 'solved', 'closed']
  }).notNull().default('open'),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  deadline: timestamp('deadline'),
  tags: json('tags'), // Array of strings
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  attachments: json('attachments'), // Array of file URLs/paths
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Mission = InferSelectModel<typeof mission>;

// Mission Prizes Table
export const missionPrize = pgTable('MissionPrize', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', {
    enum: ['cash', 'credits', 'nft', 'merchandise', 'access']
  }).notNull(),
  description: text('description').notNull(),
  providedBy: varchar('providedBy', { enum: ['creator', 'platform'] }).notNull(),
  condition: varchar('condition', { length: 100 }), // "Best Solution", "Most Upvotes", etc.
  icon: varchar('icon', { length: 10 }), // Emoji icon
  isAwarded: boolean('isAwarded').notNull().default(false),
  awardedToSolutionId: uuid('awardedToSolutionId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MissionPrize = InferSelectModel<typeof missionPrize>;

// Solutions Table
export const solution = pgTable('Solution', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  upvotes: integer('upvotes').notNull().default(0),
  downvotes: integer('downvotes').notNull().default(0),
  isAccepted: boolean('isAccepted').notNull().default(false),
  points: integer('points').notNull().default(50), // Base points for submission
  attachments: json('attachments'), // Array of file URLs/paths
  characterConfig: json('characterConfig'), // Character generation settings
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Solution = InferSelectModel<typeof solution>;

// Fix the circular reference by adding the foreign key after solution table is defined
export const missionPrizeWithSolutionRef = pgTable('MissionPrize', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', {
    enum: ['cash', 'credits', 'nft', 'merchandise', 'access']
  }).notNull(),
  description: text('description').notNull(),
  providedBy: varchar('providedBy', { enum: ['creator', 'platform'] }).notNull(),
  condition: varchar('condition', { length: 100 }), // "Best Solution", "Most Upvotes", etc.
  icon: varchar('icon', { length: 10 }), // Emoji icon
  isAwarded: boolean('isAwarded').notNull().default(false),
  awardedToSolutionId: uuid('awardedToSolutionId')
    .references(() => solution.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// User Season Points (tracks points per season)
export const userSeasonPoints = pgTable('UserSeasonPoints', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' }),
  points: integer('points').notNull().default(0),
  rank: integer('rank'),
  missionsCompleted: integer('missionsCompleted').notNull().default(0),
  solutionsSubmitted: integer('solutionsSubmitted').notNull().default(0),
  solutionsAccepted: integer('solutionsAccepted').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => ({
  userSeasonUnique: unique().on(table.userId, table.seasonId),
}));

export type UserSeasonPoints = InferSelectModel<typeof userSeasonPoints>;

// ==================== ACHIEVEMENTS SYSTEM ====================

// Achievement Definitions Table
export const achievementDefinition = pgTable('AchievementDefinition', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 10 }).notNull(), // Emoji icon
  rarity: varchar('rarity', {
    enum: ['common', 'rare', 'epic', 'legendary']
  }).notNull().default('common'),
  category: varchar('category', { length: 50 }).notNull(), // 'missions', 'social', 'streak', etc.
  criteria: json('criteria').notNull(), // Achievement unlock criteria
  points: integer('points').notNull().default(0), // Points awarded for achievement
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type AchievementDefinition = InferSelectModel<typeof achievementDefinition>;

// User Achievements (unlocked achievements)
export const userAchievement = pgTable('UserAchievement', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievementId')
    .notNull()
    .references(() => achievementDefinition.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlockedAt').notNull().defaultNow(),
  progress: json('progress'), // Progress data that led to unlock
}, (table) => ({
  userAchievementUnique: unique().on(table.userId, table.achievementId),
}));

export type UserAchievement = InferSelectModel<typeof userAchievement>;

// ==================== VOTING SYSTEM ====================

// Mission Votes
export const missionVote = pgTable('MissionVote', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  voteType: varchar('voteType', { enum: ['up', 'down'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({
  userMissionVoteUnique: unique().on(table.userId, table.missionId),
}));

export type MissionVote = InferSelectModel<typeof missionVote>;

// Solution Votes
export const solutionVote = pgTable('SolutionVote', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  solutionId: uuid('solutionId')
    .notNull()
    .references(() => solution.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  voteType: varchar('voteType', { enum: ['up', 'down'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({
  userSolutionVoteUnique: unique().on(table.userId, table.solutionId),
}));

export type SolutionVote = InferSelectModel<typeof solutionVote>;

// ==================== NOTIFICATIONS SYSTEM ====================

// Notifications Table
export const notification = pgTable('Notification', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: varchar('type', {
    enum: ['mission_solved', 'solution_accepted', 'achievement_unlocked', 'new_mission', 'season_started', 'season_ended', 'prize_awarded', 'vote_received']
  }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  link: varchar('link', { length: 255 }), // Optional link to related content
  metadata: json('metadata'), // Additional notification data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Notification = InferSelectModel<typeof notification>;

// ==================== POINTS & REWARDS SYSTEM ====================

// Points Transactions (for tracking all point changes)
export const pointsTransaction = pgTable('PointsTransaction', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  seasonId: uuid('seasonId')
    .references(() => season.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Can be negative for deductions
  type: varchar('type', {
    enum: ['mission_submission', 'solution_submission', 'solution_accepted', 'vote_received', 'achievement_unlocked', 'prize_awarded', 'penalty', 'bonus']
  }).notNull(),
  description: text('description').notNull(),
  relatedMissionId: uuid('relatedMissionId')
    .references(() => mission.id, { onDelete: 'set null' }),
  relatedSolutionId: uuid('relatedSolutionId')
    .references(() => solution.id, { onDelete: 'set null' }),
  relatedAchievementId: uuid('relatedAchievementId')
    .references(() => achievementDefinition.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type PointsTransaction = InferSelectModel<typeof pointsTransaction>;

// Prize Awards (tracks actual prize distributions)
export const prizeAward = pgTable('PrizeAward', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  seasonId: uuid('seasonId')
    .references(() => season.id, { onDelete: 'cascade' }),
  missionId: uuid('missionId')
    .references(() => mission.id, { onDelete: 'cascade' }),
  solutionId: uuid('solutionId')
    .references(() => solution.id, { onDelete: 'cascade' }),
  seasonPrizeId: uuid('seasonPrizeId')
    .references(() => seasonPrize.id, { onDelete: 'set null' }),
  missionPrizeId: uuid('missionPrizeId')
    .references(() => missionPrize.id, { onDelete: 'set null' }),
  prizeType: varchar('prizeType', {
    enum: ['season_prize', 'mission_prize']
  }).notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', {
    enum: ['cash', 'credits', 'nft', 'merchandise', 'access']
  }).notNull(),
  status: varchar('status', {
    enum: ['pending', 'processing', 'awarded', 'failed']
  }).notNull().default('pending'),
  paymentDetails: json('paymentDetails'), // Payment processing info
  awardedAt: timestamp('awardedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type PrizeAward = InferSelectModel<typeof prizeAward>;

// ==================== USER ACTIVITY TRACKING ====================

// User Activity Log (for streak tracking, analytics, etc.)
export const userActivity = pgTable('UserActivity', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activityType: varchar('activityType', {
    enum: ['login', 'mission_submit', 'solution_submit', 'vote_cast', 'achievement_unlock', 'profile_update']
  }).notNull(),
  description: text('description'),
  metadata: json('metadata'), // Additional activity data
  date: timestamp('date').notNull().defaultNow(),
});

export type UserActivity = InferSelectModel<typeof userActivity>;

// ==================== MISSION TRACKING ====================

// Mission Participants (tracks who's working on what)
export const missionParticipant = pgTable('MissionParticipant', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: varchar('status', {
    enum: ['interested', 'working', 'submitted', 'completed']
  }).notNull().default('interested'),
  joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  lastActivityAt: timestamp('lastActivityAt').notNull().defaultNow(),
}, (table) => ({
  userMissionParticipantUnique: unique().on(table.userId, table.missionId),
}));

export type MissionParticipant = InferSelectModel<typeof missionParticipant>;

// Mission Views (for analytics)
export const missionView = pgTable('MissionView', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .references(() => user.id, { onDelete: 'cascade' }), // Null for anonymous views
  ipAddress: varchar('ipAddress', { length: 45 }), // For anonymous tracking
  userAgent: text('userAgent'),
  viewedAt: timestamp('viewedAt').notNull().defaultNow(),
});

export type MissionView = InferSelectModel<typeof missionView>;

// ==================== LEADERBOARDS & RANKINGS ====================

// Season Leaderboard (materialized view for performance)
export const seasonLeaderboard = pgTable('SeasonLeaderboard', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  points: integer('points').notNull(),
  missionsCompleted: integer('missionsCompleted').notNull().default(0),
  solutionsSubmitted: integer('solutionsSubmitted').notNull().default(0),
  solutionsAccepted: integer('solutionsAccepted').notNull().default(0),
  lastUpdated: timestamp('lastUpdated').notNull().defaultNow(),
}, (table) => ({
  seasonUserUnique: unique().on(table.seasonId, table.userId),
}));

export type SeasonLeaderboard = InferSelectModel<typeof seasonLeaderboard>;

// Global Leaderboard (all-time rankings)
export const globalLeaderboard = pgTable('GlobalLeaderboard', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  rank: integer('rank').notNull(),
  totalPoints: integer('totalPoints').notNull(),
  seasonsParticipated: integer('seasonsParticipated').notNull().default(0),
  totalMissionsCompleted: integer('totalMissionsCompleted').notNull().default(0),
  totalSolutionsSubmitted: integer('totalSolutionsSubmitted').notNull().default(0),
  totalSolutionsAccepted: integer('totalSolutionsAccepted').notNull().default(0),
  winRate: decimal('winRate', { precision: 5, scale: 4 }).notNull().default('0.0000'), // Percentage as decimal
  lastUpdated: timestamp('lastUpdated').notNull().defaultNow(),
});

export type GlobalLeaderboard = InferSelectModel<typeof globalLeaderboard>;

// ==================== TAGS & CATEGORIES ====================

// Mission Tags (for better organization and search)
export const missionTag = pgTable('MissionTag', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).notNull().default('#6B7280'), // Hex color
  usageCount: integer('usageCount').notNull().default(0),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MissionTag = InferSelectModel<typeof missionTag>;

// Mission Tag Relations (many-to-many)
export const missionTagRelation = pgTable('MissionTagRelation', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  missionId: uuid('missionId')
    .notNull()
    .references(() => mission.id, { onDelete: 'cascade' }),
  tagId: uuid('tagId')
    .notNull()
    .references(() => missionTag.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({
  missionTagUnique: unique().on(table.missionId, table.tagId),
}));

export type MissionTagRelation = InferSelectModel<typeof missionTagRelation>;

// ==================== MODERATION & REPORTING ====================

// Reports Table (for content moderation)
export const report = pgTable('Report', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  reporterId: uuid('reporterId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  reportedUserId: uuid('reportedUserId')
    .references(() => user.id, { onDelete: 'cascade' }),
  missionId: uuid('missionId')
    .references(() => mission.id, { onDelete: 'cascade' }),
  solutionId: uuid('solutionId')
    .references(() => solution.id, { onDelete: 'cascade' }),
  reason: varchar('reason', {
    enum: ['spam', 'inappropriate', 'plagiarism', 'harassment', 'off-topic', 'other']
  }).notNull(),
  description: text('description'),
  status: varchar('status', {
    enum: ['pending', 'reviewing', 'resolved', 'dismissed']
  }).notNull().default('pending'),
  moderatorId: uuid('moderatorId')
    .references(() => user.id, { onDelete: 'set null' }),
  moderatorNotes: text('moderatorNotes'),
  resolvedAt: timestamp('resolvedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Report = InferSelectModel<typeof report>;

// ==================== ANALYTICS & METRICS ====================

// Season Analytics (for insights and reporting)
export const seasonAnalytics = pgTable('SeasonAnalytics', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  seasonId: uuid('seasonId')
    .notNull()
    .references(() => season.id, { onDelete: 'cascade' })
    .unique(),
  totalMissions: integer('totalMissions').notNull().default(0),
  totalSolutions: integer('totalSolutions').notNull().default(0),
  totalParticipants: integer('totalParticipants').notNull().default(0),
  averagePointsPerMission: decimal('averagePointsPerMission', { precision: 8, scale: 2 }),
  averageSolutionsPerMission: decimal('averageSolutionsPerMission', { precision: 8, scale: 2 }),
  categoryBreakdown: json('categoryBreakdown'), // Mission count by category
  difficultyBreakdown: json('difficultyBreakdown'), // Mission count by difficulty
  dailyActivity: json('dailyActivity'), // Daily activity metrics
  lastUpdated: timestamp('lastUpdated').notNull().defaultNow(),
});

export type SeasonAnalytics = InferSelectModel<typeof seasonAnalytics>;

// ==================== EXTENDED TYPES FOR FRONTEND ====================

// Extended types that include relations (for frontend use)
export type MissionWithDetails = Mission & {
  author: UserTournamentProfile;
  season: Season;
  solutions: Solution[];
  missionPrizes: MissionPrize[];
  tags: MissionTag[];
  votes: MissionVote[];
  participants: MissionParticipant[];
};

export type SolutionWithDetails = Solution & {
  author: UserTournamentProfile;
  mission: Mission;
  votes: SolutionVote[];
  awards: PrizeAward[];
};

export type UserWithTournamentData = UserTournamentProfile & {
  achievements: (UserAchievement & { achievement: AchievementDefinition })[];
  seasonPoints: UserSeasonPoints[];
  notifications: Notification[];
  submissions: Mission[];
  solutions: Solution[];
};

export type SeasonWithDetails = Season & {
  prizes: SeasonPrize[];
  missions: Mission[];
  leaderboard: SeasonLeaderboard[];
  analytics: SeasonAnalytics | null;
};

// ==================== TOURNAMENT-SPECIFIC QUERIES ====================

// Helper types for common tournament queries
export type LeaderboardEntry = {
  user: UserTournamentProfile;
  seasonPoints: UserSeasonPoints;
  rank: number;
};

export type MissionSummary = {
  mission: Mission;
  author: UserTournamentProfile;
  solutionCount: number;
  topSolution: Solution | null;
  userVote: MissionVote | null;
};

export type UserStats = {
  profile: UserTournamentProfile;
  currentSeasonRank: number;
  globalRank: number;
  recentAchievements: UserAchievement[];
  pointsThisSeason: number;
  streakDays: number;
};
