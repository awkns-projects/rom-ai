import { relations } from "drizzle-orm/relations";
import { user, app, loginToken, refreshToken, chat, message, vote, document, suggestion } from "./schema";

export const appRelations = relations(app, ({one}) => ({
	user: one(user, {
		fields: [app.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	apps: many(app),
	loginTokens: many(loginToken),
	refreshTokens: many(refreshToken),
	chats: many(chat),
	documents: many(document),
	suggestions: many(suggestion),
}));

export const loginTokenRelations = relations(loginToken, ({one}) => ({
	user: one(user, {
		fields: [loginToken.userId],
		references: [user.id]
	}),
}));

export const refreshTokenRelations = relations(refreshToken, ({one}) => ({
	user: one(user, {
		fields: [refreshToken.userId],
		references: [user.id]
	}),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	messages: many(message),
	votes: many(vote),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const voteRelations = relations(vote, ({one}) => ({
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
	suggestions: many(suggestion),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
}));