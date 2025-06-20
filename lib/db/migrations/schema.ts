import { pgTable, foreignKey, text, timestamp, jsonb, boolean, varchar, integer, uniqueIndex } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const app = pgTable("App", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	userId: text().notNull(),
	data: jsonb(),
	schema: jsonb(),
},
(table) => {
	return {
		appUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "App_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const loginToken = pgTable("LoginToken", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	approved: boolean().default(false).notNull(),
	expires: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	email: text(),
	secret: text(),
	ip: text(),
	userAgent: text(),
	userAgentRaw: text(),
	geo: text(),
	domain: text(),
	deleted: boolean().default(false),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
},
(table) => {
	return {
		loginTokenUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "LoginToken_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const refreshToken = pgTable("RefreshToken", {
	loginTokenId: text().primaryKey().notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expires: timestamp({ precision: 3, mode: 'string' }).notNull(),
	value: text().notNull(),
	lastActive: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	ip: text(),
	userAgent: text(),
	userAgentRaw: text(),
	geo: text(),
	deleted: boolean().default(false),
	deletedAt: timestamp({ precision: 3, mode: 'string' }),
	revoked: boolean().default(false).notNull(),
	revokedAt: timestamp({ precision: 3, mode: 'string' }),
	previousTokenId: text(),
},
(table) => {
	return {
		refreshTokenUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "RefreshToken_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	}
});

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
},
(table) => {
	return {
		emailKey: uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast()),
	}
});

export const chat = pgTable("Chat", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	title: text().notNull(),
	userId: text().notNull(),
	visibility: varchar({ length: 7 }).default('private').notNull(),
},
(table) => {
	return {
		chatUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const message = pgTable("Message", {
	id: text().primaryKey().notNull(),
	chatId: text().notNull(),
	role: text().notNull(),
	parts: jsonb().notNull(),
	attachments: jsonb().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		messageChatIdFkey: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const vote = pgTable("Vote", {
	chatId: text().notNull(),
	messageId: text().notNull(),
	isUpvoted: boolean().notNull(),
	id: text().primaryKey().notNull(),
},
(table) => {
	return {
		voteChatIdFkey: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
		voteMessageIdFkey: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const document = pgTable("Document", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	title: text().notNull(),
	content: text(),
	kind: varchar({ length: 4 }).default('text').notNull(),
	userId: text().notNull(),
},
(table) => {
	return {
		documentUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});

export const suggestion = pgTable("Suggestion", {
	id: text().primaryKey().notNull(),
	documentId: text().notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => {
	return {
		suggestionUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
		suggestionDocumentIdFkey: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "Suggestion_documentId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	}
});