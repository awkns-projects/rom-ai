import { relations } from "drizzle-orm/relations";
import { mission, missionParticipant, user, avatar, romCard, cardType, cardSlot, chat, document, message, oauthConnection, order, orderItem, stream, suggestion, missionPrize, solution, globalLeaderboard, season, missionVote, notification, pointsTransaction, prizeAward, seasonPrize, report, seasonAnalytics, missionTagRelation, missionTag, seasonLeaderboard, missionView, userAchievement, achievementDefinition, solutionVote, userActivity, userSeasonPoints, userTournamentProfile, vote } from "./schema";

export const missionParticipantRelations = relations(missionParticipant, ({one}) => ({
	mission: one(mission, {
		fields: [missionParticipant.missionId],
		references: [mission.id]
	}),
	user: one(user, {
		fields: [missionParticipant.userId],
		references: [user.id]
	}),
}));

export const missionRelations = relations(mission, ({one, many}) => ({
	missionParticipants: many(missionParticipant),
	missionPrizes: many(missionPrize),
	season: one(season, {
		fields: [mission.seasonId],
		references: [season.id]
	}),
	user: one(user, {
		fields: [mission.authorId],
		references: [user.id]
	}),
	missionVotes: many(missionVote),
	pointsTransactions: many(pointsTransaction),
	prizeAwards: many(prizeAward),
	reports: many(report),
	missionTagRelations: many(missionTagRelation),
	missionViews: many(missionView),
	solutions: many(solution),
}));

export const userRelations = relations(user, ({many}) => ({
	missionParticipants: many(missionParticipant),
	avatars: many(avatar),
	romCards: many(romCard),
	chats: many(chat),
	documents: many(document),
	oauthConnections: many(oauthConnection),
	orders: many(order),
	suggestions: many(suggestion),
	globalLeaderboards: many(globalLeaderboard),
	missions: many(mission),
	missionVotes: many(missionVote),
	notifications: many(notification),
	pointsTransactions: many(pointsTransaction),
	prizeAwards: many(prizeAward),
	reports_reporterId: many(report, {
		relationName: "report_reporterId_user_id"
	}),
	reports_reportedUserId: many(report, {
		relationName: "report_reportedUserId_user_id"
	}),
	reports_moderatorId: many(report, {
		relationName: "report_moderatorId_user_id"
	}),
	seasonLeaderboards: many(seasonLeaderboard),
	missionViews: many(missionView),
	userAchievements: many(userAchievement),
	solutions: many(solution),
	solutionVotes: many(solutionVote),
	userActivities: many(userActivity),
	userSeasonPoints: many(userSeasonPoints),
	userTournamentProfiles: many(userTournamentProfile),
}));

export const avatarRelations = relations(avatar, ({one}) => ({
	user: one(user, {
		fields: [avatar.userId],
		references: [user.id]
	}),
}));

export const romCardRelations = relations(romCard, ({one, many}) => ({
	user: one(user, {
		fields: [romCard.userId],
		references: [user.id]
	}),
	cardType: one(cardType, {
		fields: [romCard.cardTypeId],
		references: [cardType.id]
	}),
	cardSlots: many(cardSlot),
	orderItems: many(orderItem),
}));

export const cardTypeRelations = relations(cardType, ({many}) => ({
	romCards: many(romCard),
	orders: many(order),
	orderItems: many(orderItem),
}));

export const cardSlotRelations = relations(cardSlot, ({one}) => ({
	romCard: one(romCard, {
		fields: [cardSlot.romCardId],
		references: [romCard.id]
	}),
	chat: one(chat, {
		fields: [cardSlot.agentId],
		references: [chat.id]
	}),
}));

export const chatRelations = relations(chat, ({one, many}) => ({
	cardSlots: many(cardSlot),
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	messages: many(message),
	streams: many(stream),
	votes: many(vote),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
	oauthConnections: many(oauthConnection),
	suggestions: many(suggestion),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const oauthConnectionRelations = relations(oauthConnection, ({one}) => ({
	user: one(user, {
		fields: [oauthConnection.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [oauthConnection.documentId],
		references: [document.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	user: one(user, {
		fields: [order.userId],
		references: [user.id]
	}),
	cardType: one(cardType, {
		fields: [order.cardTypeId],
		references: [cardType.id]
	}),
	orderItems: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
	romCard: one(romCard, {
		fields: [orderItem.romCardId],
		references: [romCard.id]
	}),
	cardType: one(cardType, {
		fields: [orderItem.cardTypeId],
		references: [cardType.id]
	}),
}));

export const streamRelations = relations(stream, ({one}) => ({
	chat: one(chat, {
		fields: [stream.chatId],
		references: [chat.id]
	}),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
}));

export const missionPrizeRelations = relations(missionPrize, ({one, many}) => ({
	mission: one(mission, {
		fields: [missionPrize.missionId],
		references: [mission.id]
	}),
	solution: one(solution, {
		fields: [missionPrize.awardedToSolutionId],
		references: [solution.id]
	}),
	prizeAwards: many(prizeAward),
}));

export const solutionRelations = relations(solution, ({one, many}) => ({
	missionPrizes: many(missionPrize),
	pointsTransactions: many(pointsTransaction),
	prizeAwards: many(prizeAward),
	reports: many(report),
	mission: one(mission, {
		fields: [solution.missionId],
		references: [mission.id]
	}),
	season: one(season, {
		fields: [solution.seasonId],
		references: [season.id]
	}),
	user: one(user, {
		fields: [solution.authorId],
		references: [user.id]
	}),
	solutionVotes: many(solutionVote),
}));

export const globalLeaderboardRelations = relations(globalLeaderboard, ({one}) => ({
	user: one(user, {
		fields: [globalLeaderboard.userId],
		references: [user.id]
	}),
}));

export const seasonRelations = relations(season, ({many}) => ({
	missions: many(mission),
	pointsTransactions: many(pointsTransaction),
	prizeAwards: many(prizeAward),
	seasonAnalytics: many(seasonAnalytics),
	seasonLeaderboards: many(seasonLeaderboard),
	solutions: many(solution),
	seasonPrizes: many(seasonPrize),
	userSeasonPoints: many(userSeasonPoints),
}));

export const missionVoteRelations = relations(missionVote, ({one}) => ({
	mission: one(mission, {
		fields: [missionVote.missionId],
		references: [mission.id]
	}),
	user: one(user, {
		fields: [missionVote.userId],
		references: [user.id]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	}),
}));

export const pointsTransactionRelations = relations(pointsTransaction, ({one}) => ({
	user: one(user, {
		fields: [pointsTransaction.userId],
		references: [user.id]
	}),
	season: one(season, {
		fields: [pointsTransaction.seasonId],
		references: [season.id]
	}),
	mission: one(mission, {
		fields: [pointsTransaction.relatedMissionId],
		references: [mission.id]
	}),
	solution: one(solution, {
		fields: [pointsTransaction.relatedSolutionId],
		references: [solution.id]
	}),
}));

export const prizeAwardRelations = relations(prizeAward, ({one}) => ({
	user: one(user, {
		fields: [prizeAward.userId],
		references: [user.id]
	}),
	season: one(season, {
		fields: [prizeAward.seasonId],
		references: [season.id]
	}),
	mission: one(mission, {
		fields: [prizeAward.missionId],
		references: [mission.id]
	}),
	solution: one(solution, {
		fields: [prizeAward.solutionId],
		references: [solution.id]
	}),
	seasonPrize: one(seasonPrize, {
		fields: [prizeAward.seasonPrizeId],
		references: [seasonPrize.id]
	}),
	missionPrize: one(missionPrize, {
		fields: [prizeAward.missionPrizeId],
		references: [missionPrize.id]
	}),
}));

export const seasonPrizeRelations = relations(seasonPrize, ({one, many}) => ({
	prizeAwards: many(prizeAward),
	season: one(season, {
		fields: [seasonPrize.seasonId],
		references: [season.id]
	}),
}));

export const reportRelations = relations(report, ({one}) => ({
	user_reporterId: one(user, {
		fields: [report.reporterId],
		references: [user.id],
		relationName: "report_reporterId_user_id"
	}),
	user_reportedUserId: one(user, {
		fields: [report.reportedUserId],
		references: [user.id],
		relationName: "report_reportedUserId_user_id"
	}),
	mission: one(mission, {
		fields: [report.missionId],
		references: [mission.id]
	}),
	solution: one(solution, {
		fields: [report.solutionId],
		references: [solution.id]
	}),
	user_moderatorId: one(user, {
		fields: [report.moderatorId],
		references: [user.id],
		relationName: "report_moderatorId_user_id"
	}),
}));

export const seasonAnalyticsRelations = relations(seasonAnalytics, ({one}) => ({
	season: one(season, {
		fields: [seasonAnalytics.seasonId],
		references: [season.id]
	}),
}));

export const missionTagRelationRelations = relations(missionTagRelation, ({one}) => ({
	mission: one(mission, {
		fields: [missionTagRelation.missionId],
		references: [mission.id]
	}),
	missionTag: one(missionTag, {
		fields: [missionTagRelation.tagId],
		references: [missionTag.id]
	}),
}));

export const missionTagRelations = relations(missionTag, ({many}) => ({
	missionTagRelations: many(missionTagRelation),
}));

export const seasonLeaderboardRelations = relations(seasonLeaderboard, ({one}) => ({
	season: one(season, {
		fields: [seasonLeaderboard.seasonId],
		references: [season.id]
	}),
	user: one(user, {
		fields: [seasonLeaderboard.userId],
		references: [user.id]
	}),
}));

export const missionViewRelations = relations(missionView, ({one}) => ({
	mission: one(mission, {
		fields: [missionView.missionId],
		references: [mission.id]
	}),
	user: one(user, {
		fields: [missionView.userId],
		references: [user.id]
	}),
}));

export const userAchievementRelations = relations(userAchievement, ({one}) => ({
	user: one(user, {
		fields: [userAchievement.userId],
		references: [user.id]
	}),
	achievementDefinition: one(achievementDefinition, {
		fields: [userAchievement.achievementId],
		references: [achievementDefinition.id]
	}),
}));

export const achievementDefinitionRelations = relations(achievementDefinition, ({many}) => ({
	userAchievements: many(userAchievement),
}));

export const solutionVoteRelations = relations(solutionVote, ({one}) => ({
	solution: one(solution, {
		fields: [solutionVote.solutionId],
		references: [solution.id]
	}),
	user: one(user, {
		fields: [solutionVote.userId],
		references: [user.id]
	}),
}));

export const userActivityRelations = relations(userActivity, ({one}) => ({
	user: one(user, {
		fields: [userActivity.userId],
		references: [user.id]
	}),
}));

export const userSeasonPointsRelations = relations(userSeasonPoints, ({one}) => ({
	user: one(user, {
		fields: [userSeasonPoints.userId],
		references: [user.id]
	}),
	season: one(season, {
		fields: [userSeasonPoints.seasonId],
		references: [season.id]
	}),
}));

export const userTournamentProfileRelations = relations(userTournamentProfile, ({one}) => ({
	user: one(user, {
		fields: [userTournamentProfile.userId],
		references: [user.id]
	}),
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