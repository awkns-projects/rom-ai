import { pgTable, unique, uuid, varchar, text, json, timestamp, foreignKey, boolean, numeric, integer, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const waitlist = pgTable("Waitlist", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	agentIdea: text().notNull(),
	cardType: varchar({ length: 50 }).default('free').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	xId: varchar({ length: 50 }),
},
(table) => {
	return {
		waitlistEmailUnique: unique("Waitlist_email_unique").on(table.email),
	}
});

export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
	openaiApiKey: text(),
	xaiApiKey: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	privyId: text(),
},
(table) => {
	return {
		userPrivyIdUnique: unique("User_privyId_unique").on(table.privyId),
	}
});

export const missionParticipant = pgTable("MissionParticipant", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	userId: uuid().notNull(),
	status: varchar().default('interested').notNull(),
	joinedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastActivityAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionParticipantMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "MissionParticipant_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		missionParticipantUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MissionParticipant_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const avatar = pgTable("Avatar", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	documentId: uuid(),
	name: varchar({ length: 255 }).notNull(),
	personality: text(),
	characterNames: text(),
	type: varchar({ length: 50 }).default('rom-unicorn').notNull(),
	romUnicornType: varchar({ length: 50 }),
	customType: varchar({ length: 50 }),
	uploadedImage: text(),
	selectedStyle: varchar({ length: 50 }),
	connectedWallet: varchar({ length: 255 }),
	selectedNft: varchar({ length: 255 }),
	unicornParts: json(),
	isActive: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		avatarUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Avatar_userId_User_id_fk"
		}),
	}
});

export const romCard = pgTable("RomCard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	cardTypeId: uuid().notNull(),
	name: varchar({ length: 100 }).notNull(),
	isDeployed: boolean().default(false).notNull(),
	balance: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	totalSpent: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		romCardUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "RomCard_userId_User_id_fk"
		}).onDelete("cascade"),
		romCardCardTypeIdCardTypeIdFk: foreignKey({
			columns: [table.cardTypeId],
			foreignColumns: [cardType.id],
			name: "RomCard_cardTypeId_CardType_id_fk"
		}),
	}
});

export const cardSlot = pgTable("CardSlot", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	romCardId: uuid().notNull(),
	slotNumber: integer().notNull(),
	agentId: uuid(),
	isActive: boolean().default(false).notNull(),
	startTime: timestamp({ mode: 'string' }),
	endTime: timestamp({ mode: 'string' }),
	totalCost: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		cardSlotRomCardIdRomCardIdFk: foreignKey({
			columns: [table.romCardId],
			foreignColumns: [romCard.id],
			name: "CardSlot_romCardId_RomCard_id_fk"
		}).onDelete("cascade"),
		cardSlotAgentIdChatIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [chat.id],
			name: "CardSlot_agentId_Chat_id_fk"
		}).onDelete("set null"),
	}
});

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	userId: uuid().notNull(),
	visibility: varchar().default('private').notNull(),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
	}
});

export const document = pgTable("Document", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	kind: varchar().default('text').notNull(),
	userId: uuid().notNull(),
	metadata: json(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
	}
});

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}),
	}
});

export const oauthConnection = pgTable("OAuthConnection", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	documentId: uuid(),
	provider: varchar().notNull(),
	providerUserId: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 255 }),
	accessToken: text().notNull(),
	refreshToken: text(),
	encryptionIv: varchar({ length: 32 }),
	expiresAt: timestamp({ mode: 'string' }),
	scopes: json(),
	providerData: json(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		oauthConnectionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "OAuthConnection_userId_User_id_fk"
		}),
		oauthConnectionDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "OAuthConnection_documentId_Document_id_fk"
		}),
	}
});

export const order = pgTable("Order", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	cardTypeId: uuid().notNull(),
	status: varchar().default('pending').notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	paymentMethod: varchar({ length: 50 }),
	paymentIntentId: varchar({ length: 255 }),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		orderUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Order_userId_User_id_fk"
		}).onDelete("cascade"),
		orderCardTypeIdCardTypeIdFk: foreignKey({
			columns: [table.cardTypeId],
			foreignColumns: [cardType.id],
			name: "Order_cardTypeId_CardType_id_fk"
		}),
	}
});

export const cardType = pgTable("CardType", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	displayName: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	maxSlots: integer().default(4).notNull(),
	features: json(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const orderItem = pgTable("OrderItem", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid().notNull(),
	romCardId: uuid(),
	cardTypeId: uuid().notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		orderItemOrderIdOrderIdFk: foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderItem_orderId_Order_id_fk"
		}).onDelete("cascade"),
		orderItemRomCardIdRomCardIdFk: foreignKey({
			columns: [table.romCardId],
			foreignColumns: [romCard.id],
			name: "OrderItem_romCardId_RomCard_id_fk"
		}).onDelete("set null"),
		orderItemCardTypeIdCardTypeIdFk: foreignKey({
			columns: [table.cardTypeId],
			foreignColumns: [cardType.id],
			name: "OrderItem_cardTypeId_CardType_id_fk"
		}),
	}
});

export const stream = pgTable("Stream", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		streamChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Stream_chatId_Chat_id_fk"
		}),
	}
});

export const suggestion = pgTable("Suggestion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid().notNull(),
	documentCreatedAt: timestamp({ mode: 'string' }).notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		suggestionDocumentIdDocumentIdFk: foreignKey({
			columns: [table.documentId],
			foreignColumns: [document.id],
			name: "Suggestion_documentId_Document_id_fk"
		}),
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
	}
});

export const missionPrize = pgTable("MissionPrize", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	value: numeric({ precision: 12, scale:  2 }).notNull(),
	type: varchar().notNull(),
	description: text().notNull(),
	providedBy: varchar().notNull(),
	condition: varchar({ length: 100 }),
	icon: varchar({ length: 10 }),
	isAwarded: boolean().default(false).notNull(),
	awardedToSolutionId: uuid(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionPrizeMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "MissionPrize_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		missionPrizeAwardedToSolutionIdSolutionIdFk: foreignKey({
			columns: [table.awardedToSolutionId],
			foreignColumns: [solution.id],
			name: "MissionPrize_awardedToSolutionId_Solution_id_fk"
		}).onDelete("set null"),
	}
});

export const achievementDefinition = pgTable("AchievementDefinition", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 10 }).notNull(),
	rarity: varchar().default('common').notNull(),
	category: varchar({ length: 50 }).notNull(),
	criteria: json().notNull(),
	points: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const globalLeaderboard = pgTable("GlobalLeaderboard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	rank: integer().notNull(),
	totalPoints: integer().notNull(),
	seasonsParticipated: integer().default(0).notNull(),
	totalMissionsCompleted: integer().default(0).notNull(),
	totalSolutionsSubmitted: integer().default(0).notNull(),
	totalSolutionsAccepted: integer().default(0).notNull(),
	winRate: numeric({ precision: 5, scale:  4 }).default('0.0000').notNull(),
	lastUpdated: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		globalLeaderboardUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "GlobalLeaderboard_userId_User_id_fk"
		}).onDelete("cascade"),
		globalLeaderboardUserIdUnique: unique("GlobalLeaderboard_userId_unique").on(table.userId),
	}
});

export const mission = pgTable("Mission", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seasonId: uuid().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text().notNull(),
	category: varchar().notNull(),
	difficulty: varchar().notNull(),
	points: integer().notNull(),
	status: varchar().default('open').notNull(),
	authorId: uuid().notNull(),
	deadline: timestamp({ mode: 'string' }),
	tags: json(),
	upvotes: integer().default(0).notNull(),
	downvotes: integer().default(0).notNull(),
	attachments: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "Mission_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		missionAuthorIdUserIdFk: foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Mission_authorId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const missionVote = pgTable("MissionVote", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	userId: uuid().notNull(),
	voteType: varchar().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionVoteMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "MissionVote_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		missionVoteUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MissionVote_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const notification = pgTable("Notification", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	type: varchar().notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	link: varchar({ length: 255 }),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		notificationUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Notification_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const pointsTransaction = pgTable("PointsTransaction", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	seasonId: uuid(),
	amount: integer().notNull(),
	type: varchar().notNull(),
	description: text().notNull(),
	relatedMissionId: uuid(),
	relatedSolutionId: uuid(),
	relatedAchievementId: uuid(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		pointsTransactionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PointsTransaction_userId_User_id_fk"
		}).onDelete("cascade"),
		pointsTransactionSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "PointsTransaction_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		pointsTransactionRelatedMissionIdMissionIdFk: foreignKey({
			columns: [table.relatedMissionId],
			foreignColumns: [mission.id],
			name: "PointsTransaction_relatedMissionId_Mission_id_fk"
		}).onDelete("set null"),
		pointsTransactionRelatedSolutionIdSolutionIdFk: foreignKey({
			columns: [table.relatedSolutionId],
			foreignColumns: [solution.id],
			name: "PointsTransaction_relatedSolutionId_Solution_id_fk"
		}).onDelete("set null"),
	}
});

export const prizeAward = pgTable("PrizeAward", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	seasonId: uuid(),
	missionId: uuid(),
	solutionId: uuid(),
	seasonPrizeId: uuid(),
	missionPrizeId: uuid(),
	prizeType: varchar().notNull(),
	value: numeric({ precision: 12, scale:  2 }).notNull(),
	type: varchar().notNull(),
	status: varchar().default('pending').notNull(),
	paymentDetails: json(),
	awardedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		prizeAwardUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PrizeAward_userId_User_id_fk"
		}).onDelete("cascade"),
		prizeAwardSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "PrizeAward_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		prizeAwardMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "PrizeAward_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		prizeAwardSolutionIdSolutionIdFk: foreignKey({
			columns: [table.solutionId],
			foreignColumns: [solution.id],
			name: "PrizeAward_solutionId_Solution_id_fk"
		}).onDelete("cascade"),
		prizeAwardSeasonPrizeIdSeasonPrizeIdFk: foreignKey({
			columns: [table.seasonPrizeId],
			foreignColumns: [seasonPrize.id],
			name: "PrizeAward_seasonPrizeId_SeasonPrize_id_fk"
		}).onDelete("set null"),
		prizeAwardMissionPrizeIdMissionPrizeIdFk: foreignKey({
			columns: [table.missionPrizeId],
			foreignColumns: [missionPrize.id],
			name: "PrizeAward_missionPrizeId_MissionPrize_id_fk"
		}).onDelete("set null"),
	}
});

export const report = pgTable("Report", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterId: uuid().notNull(),
	reportedUserId: uuid(),
	missionId: uuid(),
	solutionId: uuid(),
	reason: varchar().notNull(),
	description: text(),
	status: varchar().default('pending').notNull(),
	moderatorId: uuid(),
	moderatorNotes: text(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		reportReporterIdUserIdFk: foreignKey({
			columns: [table.reporterId],
			foreignColumns: [user.id],
			name: "Report_reporterId_User_id_fk"
		}).onDelete("cascade"),
		reportReportedUserIdUserIdFk: foreignKey({
			columns: [table.reportedUserId],
			foreignColumns: [user.id],
			name: "Report_reportedUserId_User_id_fk"
		}).onDelete("cascade"),
		reportMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "Report_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		reportSolutionIdSolutionIdFk: foreignKey({
			columns: [table.solutionId],
			foreignColumns: [solution.id],
			name: "Report_solutionId_Solution_id_fk"
		}).onDelete("cascade"),
		reportModeratorIdUserIdFk: foreignKey({
			columns: [table.moderatorId],
			foreignColumns: [user.id],
			name: "Report_moderatorId_User_id_fk"
		}).onDelete("set null"),
	}
});

export const seasonAnalytics = pgTable("SeasonAnalytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seasonId: uuid().notNull(),
	totalMissions: integer().default(0).notNull(),
	totalSolutions: integer().default(0).notNull(),
	totalParticipants: integer().default(0).notNull(),
	averagePointsPerMission: numeric({ precision: 8, scale:  2 }),
	averageSolutionsPerMission: numeric({ precision: 8, scale:  2 }),
	categoryBreakdown: json(),
	difficultyBreakdown: json(),
	dailyActivity: json(),
	lastUpdated: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		seasonAnalyticsSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "SeasonAnalytics_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		seasonAnalyticsSeasonIdUnique: unique("SeasonAnalytics_seasonId_unique").on(table.seasonId),
	}
});

export const missionTagRelation = pgTable("MissionTagRelation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	tagId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionTagRelationMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "MissionTagRelation_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		missionTagRelationTagIdMissionTagIdFk: foreignKey({
			columns: [table.tagId],
			foreignColumns: [missionTag.id],
			name: "MissionTagRelation_tagId_MissionTag_id_fk"
		}).onDelete("cascade"),
		missionTagRelationMissionIdTagIdUnique: unique("MissionTagRelation_missionId_tagId_unique").on(table.missionId, table.tagId),
	}
});

export const seasonLeaderboard = pgTable("SeasonLeaderboard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seasonId: uuid().notNull(),
	userId: uuid().notNull(),
	rank: integer().notNull(),
	points: integer().notNull(),
	missionsCompleted: integer().default(0).notNull(),
	solutionsSubmitted: integer().default(0).notNull(),
	solutionsAccepted: integer().default(0).notNull(),
	lastUpdated: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		seasonLeaderboardSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "SeasonLeaderboard_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		seasonLeaderboardUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "SeasonLeaderboard_userId_User_id_fk"
		}).onDelete("cascade"),
		seasonLeaderboardSeasonIdUserIdUnique: unique("SeasonLeaderboard_seasonId_userId_unique").on(table.seasonId, table.userId),
	}
});

export const season = pgTable("Season", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }).notNull(),
	status: varchar().default('upcoming').notNull(),
	theme: varchar({ length: 100 }).notNull(),
	image: text().notNull(),
	totalPrizePool: numeric({ precision: 12, scale:  2 }).default('0.00').notNull(),
	participantCount: integer().default(0).notNull(),
	missionCount: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const missionTag = pgTable("MissionTag", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	color: varchar({ length: 7 }).default('#6B7280').notNull(),
	usageCount: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionTagNameUnique: unique("MissionTag_name_unique").on(table.name),
	}
});

export const missionView = pgTable("MissionView", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	userId: uuid(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	viewedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		missionViewMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "MissionView_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		missionViewUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "MissionView_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const userAchievement = pgTable("UserAchievement", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	achievementId: uuid().notNull(),
	unlockedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	progress: json(),
},
(table) => {
	return {
		userAchievementUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserAchievement_userId_User_id_fk"
		}).onDelete("cascade"),
		userAchievementAchievementIdAchievementDefinitionIdFk: foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievementDefinition.id],
			name: "UserAchievement_achievementId_AchievementDefinition_id_fk"
		}).onDelete("cascade"),
		userAchievementUserIdAchievementIdUnique: unique("UserAchievement_userId_achievementId_unique").on(table.userId, table.achievementId),
	}
});

export const solution = pgTable("Solution", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	missionId: uuid().notNull(),
	seasonId: uuid().notNull(),
	content: text().notNull(),
	authorId: uuid().notNull(),
	upvotes: integer().default(0).notNull(),
	downvotes: integer().default(0).notNull(),
	isAccepted: boolean().default(false).notNull(),
	points: integer().default(50).notNull(),
	attachments: json(),
	characterConfig: json(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		solutionMissionIdMissionIdFk: foreignKey({
			columns: [table.missionId],
			foreignColumns: [mission.id],
			name: "Solution_missionId_Mission_id_fk"
		}).onDelete("cascade"),
		solutionSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "Solution_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		solutionAuthorIdUserIdFk: foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "Solution_authorId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const seasonPrize = pgTable("SeasonPrize", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seasonId: uuid().notNull(),
	rank: integer().notNull(),
	title: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	value: numeric({ precision: 12, scale:  2 }).notNull(),
	type: varchar().notNull(),
	icon: varchar({ length: 10 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		seasonPrizeSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "SeasonPrize_seasonId_Season_id_fk"
		}).onDelete("cascade"),
	}
});

export const solutionVote = pgTable("SolutionVote", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	solutionId: uuid().notNull(),
	userId: uuid().notNull(),
	voteType: varchar().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		solutionVoteSolutionIdSolutionIdFk: foreignKey({
			columns: [table.solutionId],
			foreignColumns: [solution.id],
			name: "SolutionVote_solutionId_Solution_id_fk"
		}).onDelete("cascade"),
		solutionVoteUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "SolutionVote_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const userActivity = pgTable("UserActivity", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	activityType: varchar().notNull(),
	description: text(),
	metadata: json(),
	date: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		userActivityUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserActivity_userId_User_id_fk"
		}).onDelete("cascade"),
	}
});

export const userSeasonPoints = pgTable("UserSeasonPoints", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	seasonId: uuid().notNull(),
	points: integer().default(0).notNull(),
	rank: integer(),
	missionsCompleted: integer().default(0).notNull(),
	solutionsSubmitted: integer().default(0).notNull(),
	solutionsAccepted: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		userSeasonPointsUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserSeasonPoints_userId_User_id_fk"
		}).onDelete("cascade"),
		userSeasonPointsSeasonIdSeasonIdFk: foreignKey({
			columns: [table.seasonId],
			foreignColumns: [season.id],
			name: "UserSeasonPoints_seasonId_Season_id_fk"
		}).onDelete("cascade"),
		userSeasonPointsUserIdSeasonIdUnique: unique("UserSeasonPoints_userId_seasonId_unique").on(table.userId, table.seasonId),
	}
});

export const userTournamentProfile = pgTable("UserTournamentProfile", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	username: varchar({ length: 50 }).notNull(),
	avatar: varchar({ length: 10 }).default('🧑‍💻').notNull(),
	totalPoints: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	badge: varchar({ length: 100 }).default('Newcomer').notNull(),
	joinDate: timestamp({ mode: 'string' }).defaultNow().notNull(),
	solvedMissions: integer().default(0).notNull(),
	submittedMissions: integer().default(0).notNull(),
	currentStreak: integer().default(0).notNull(),
	longestStreak: integer().default(0).notNull(),
	lastActivityDate: timestamp({ mode: 'string' }),
	isOnline: boolean().default(false).notNull(),
	bio: text(),
	website: varchar({ length: 255 }),
	location: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		userTournamentProfileUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserTournamentProfile_userId_User_id_fk"
		}).onDelete("cascade"),
		userTournamentProfileUserIdUnique: unique("UserTournamentProfile_userId_unique").on(table.userId),
		userTournamentProfileUsernameUnique: unique("UserTournamentProfile_username_unique").on(table.username),
	}
});

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}),
		voteMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}),
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
	}
});