import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type Message,
  type Chat,
  stream,
  avatar,
  type Avatar,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Enhanced database connection with error handling
function createDatabaseConnection() {
  const postgresUrl = process.env.POSTGRES_URL;
  
  if (!postgresUrl) {
    console.error('❌ Database Error: POSTGRES_URL environment variable is not set');
    console.error('📝 Required environment variables for production:');
    console.error('   - POSTGRES_URL: PostgreSQL connection string');
    console.error('   - AUTH_SECRET: NextAuth secret key');
    throw new Error('POSTGRES_URL environment variable is required for database connection');
  }

  try {
    const client = postgres(postgresUrl, {
      onnotice: () => {}, // Suppress notices
      max: 10, // Connection pool size
      idle_timeout: 60, // Close idle connections after 60 seconds
      connect_timeout: 30, // Connection timeout in seconds
    });
    
    // Test the connection
    console.log('🔌 Database connection configured successfully');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new ChatSDKError(
      'bad_request:database',
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

const client = createDatabaseConnection();
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    console.log(`🔍 Looking up user: ${email.slice(0, 10)}...`);
    const result = await db.select().from(user).where(eq(user.email, email));
    console.log(`✅ User lookup completed: ${result.length} results found`);
    return result;
  } catch (error) {
    console.error('❌ Failed to get user by email:', {
      email: email.slice(0, 10) + '...',
      error: error instanceof Error ? error.message : error,
      postgresUrl: process.env.POSTGRES_URL ? 'present' : 'missing',
    });
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    console.log(`👤 Creating regular user: ${email.slice(0, 10)}...`);
    const result = await db.insert(user).values({ email, password: hashedPassword });
    console.log('✅ Regular user created successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to create user:', {
      email: email.slice(0, 10) + '...',
      error: error instanceof Error ? error.message : error,
      postgresUrl: process.env.POSTGRES_URL ? 'present' : 'missing',
    });
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    console.log(`👻 Creating guest user: ${email}`);
    const result = await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
    console.log('✅ Guest user created successfully:', result[0]?.email);
    return result;
  } catch (error) {
    console.error('❌ Failed to create guest user:', {
      email,
      error: error instanceof Error ? error.message : error,
      postgresUrl: process.env.POSTGRES_URL ? 'present' : 'missing',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.error('❌ Database error in saveChat:', error);
    console.error('❌ Chat data being saved:', { id, userId, title, visibility });
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<Message>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('❌ Database error in saveMessages:', error);
    console.error('❌ Messages being saved:', JSON.stringify(messages, null, 2));
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function updateMessage({
  messageId,
  message: messageData,
}: {
  messageId: string;
  message: Partial<Message>;
}) {
  try {
    return await db
      .update(message)
      .set(messageData)
      .where(eq(message.id, messageId))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update message');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  metadata,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  metadata?: any;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        metadata,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function updateDocument({
  id,
  title,
  content,
  userId,
  metadata,
}: {
  id: string;
  title?: string;
  content?: string;
  userId: string;
  metadata?: any;
}) {
  try {
    const [existingDocument] = await db
      .select()
      .from(document)
      .where(and(eq(document.id, id), eq(document.userId, userId)))
      .orderBy(desc(document.createdAt))
      .limit(1);

    if (!existingDocument) {
      throw new ChatSDKError('not_found:document', 'Document not found');
    }

    const [updatedDocument] = await db
      .update(document)
      .set({
        ...(title && { title }),
        ...(content && { content }),
        ...(metadata !== undefined && { metadata }),
      })
      .where(
        and(
          eq(document.id, id),
          eq(document.createdAt, existingDocument.createdAt),
          eq(document.userId, userId)
        )
      )
      .returning();

    return updatedDocument;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError('bad_request:database', 'Failed to update document');
  }
}

export async function saveOrUpdateDocument({
  id,
  title,
  kind,
  content,
  userId,
  metadata,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  metadata?: any;
}) {
  try {
    const [existingDocument] = await db
      .select()
      .from(document)
      .where(and(eq(document.id, id), eq(document.userId, userId)))
      .orderBy(desc(document.createdAt))
      .limit(1);

    if (existingDocument) {
      return await updateDocument({
        id,
        title,
        content,
        userId,
        metadata,
      });
    } else {
      return await saveDocument({
        id,
        title,
        kind,
        content,
        userId,
        metadata,
      });
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError('bad_request:database', 'Failed to save or update document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Database error in getDocumentsById:', error);
    console.error('Query parameters:', { id });
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function getAllDocuments() {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.kind, 'agent'))
      .orderBy(desc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Database error in getAllDocuments:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all documents',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(and(eq(message.chatId, chatId), gt(message.createdAt, timestamp)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat ID after timestamp',
    );
  }
}

// Avatar queries
export async function createAvatar({
  userId,
  documentId,
  name,
  personality,
  characterNames,
  type,
  romUnicornType,
  customType,
  uploadedImage,
  selectedStyle,
  connectedWallet,
  selectedNFT,
  unicornParts,
  isActive = false,
}: {
  userId: string;
  documentId?: string;
  name: string;
  personality?: string;
  characterNames?: string;
  type: string;
  romUnicornType?: string;
  customType?: string;
  uploadedImage?: string;
  selectedStyle?: string;
  connectedWallet?: string;
  selectedNFT?: string;
  unicornParts?: any;
  isActive?: boolean;
}) {
  try {
    const [newAvatar] = await db.insert(avatar).values({
      userId,
      documentId,
      name,
      personality,
      characterNames,
      type,
      romUnicornType,
      customType,
      uploadedImage,
      selectedStyle,
      connectedWallet,
      selectedNFT,
      unicornParts,
      isActive,
    }).returning();

    return newAvatar;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create avatar',
    );
  }
}

export async function getAvatarsByUserId({
  userId,
  limit = 50,
}: {
  userId: string;
  limit?: number;
}) {
  try {
      return await db
      .select()
      .from(avatar)
      .where(eq(avatar.userId, userId))
      .orderBy(desc(avatar.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get avatars by user ID',
    );
  }
}

export async function getAvatarsByDocumentId({
  documentId,
  userId,
  limit = 50,
}: {
  documentId: string;
  userId: string;
  limit?: number;
}) {
  try {
      return await db
      .select()
      .from(avatar)
      .where(and(eq(avatar.documentId, documentId), eq(avatar.userId, userId)))
      .orderBy(desc(avatar.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get avatars by document ID',
    );
  }
}

export async function getAvatarById({
  id,
}: {
  id: string;
}) {
  try {
    const [avatarResult] = await db
      .select()
      .from(avatar)
      .where(eq(avatar.id, id));

    return avatarResult;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get avatar by ID',
    );
  }
}

export async function updateAvatar({
  id,
  name,
  personality,
  characterNames,
  type,
  romUnicornType,
  customType,
  uploadedImage,
  selectedStyle,
  connectedWallet,
  selectedNFT,
  unicornParts,
  isActive,
}: {
  id: string;
  name?: string;
  personality?: string;
  characterNames?: string;
  type?: string;
  romUnicornType?: string;
  customType?: string;
  uploadedImage?: string;
  selectedStyle?: string;
  connectedWallet?: string;
  selectedNFT?: string;
  unicornParts?: any;
  isActive?: boolean;
}) {
  try {
    const updateData: any = { updatedAt: new Date() };
    
    if (name !== undefined) updateData.name = name;
    if (personality !== undefined) updateData.personality = personality;
    if (characterNames !== undefined) updateData.characterNames = characterNames;
    if (type !== undefined) updateData.type = type;
    if (romUnicornType !== undefined) updateData.romUnicornType = romUnicornType;
    if (customType !== undefined) updateData.customType = customType;
    if (uploadedImage !== undefined) updateData.uploadedImage = uploadedImage;
    if (selectedStyle !== undefined) updateData.selectedStyle = selectedStyle;
    if (connectedWallet !== undefined) updateData.connectedWallet = connectedWallet;
    if (selectedNFT !== undefined) updateData.selectedNFT = selectedNFT;
    if (unicornParts !== undefined) updateData.unicornParts = unicornParts;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedAvatar] = await db
      .update(avatar)
      .set(updateData)
      .where(eq(avatar.id, id))
      .returning();

    return updatedAvatar;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update avatar',
    );
  }
}

export async function deleteAvatar({
  id,
}: {
  id: string;
}) {
  try {
    await db.delete(avatar).where(eq(avatar.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete avatar',
    );
  }
}

export async function setActiveAvatar({
  userId,
  avatarId,
  documentId,
}: {
  userId: string;
  avatarId: string;
  documentId?: string;
}) {
  try {
    // First, set all avatars for this user and document to inactive
    const whereCondition = documentId 
      ? and(eq(avatar.userId, userId), eq(avatar.documentId, documentId))
      : eq(avatar.userId, userId);
      
    await db
      .update(avatar)
      .set({ isActive: false, updatedAt: new Date() })
      .where(whereCondition);

    // Then, set the specified avatar to active
    const [activeAvatar] = await db
      .update(avatar)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(avatar.id, avatarId), eq(avatar.userId, userId)))
      .returning();

    return activeAvatar;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to set active avatar',
    );
  }
}

export async function getActiveAvatar({
  userId,
  documentId,
}: {
  userId: string;
  documentId?: string;
}) {
  try {
    const whereCondition = documentId 
      ? and(eq(avatar.userId, userId), eq(avatar.documentId, documentId), eq(avatar.isActive, true))
      : and(eq(avatar.userId, userId), eq(avatar.isActive, true));
      
    const [activeAvatar] = await db
      .select()
      .from(avatar)
      .where(whereCondition);

    return activeAvatar;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active avatar',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

export async function getDocumentsByUserId({ userId }: { userId: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(and(eq(document.userId, userId), eq(document.kind, 'agent')))
      .orderBy(desc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Database error in getDocumentsByUserId:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by user id',
    );
  }
}
