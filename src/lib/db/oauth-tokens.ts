import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { oauthConnection, avatar } from './schema';
import crypto from 'crypto';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'fallback-encryption-key';

// Ensure the key is 32 bytes for AES-256
const getEncryptionKey = (): Buffer => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

// Encrypt sensitive data
export function encryptToken(token: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

// Decrypt sensitive data
export function decryptToken(encrypted: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), Buffer.from(iv, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// OAuth connection interface
export interface OAuthConnectionData {
  provider: 'instagram' | 'facebook' | 'shopify' | 'threads' | 'google' | 'github-oauth' | 'linkedin' | 'notion';
  providerUserId: string;
  username?: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string[];
  scope?: string;
  providerData?: any;
  profileData?: any;
  avatarId?: string;
}

// Save OAuth connection
export async function saveOAuthConnection(
  userId: string,
  connectionData: OAuthConnectionData
): Promise<{ success: boolean; connectionId?: string; error?: string }> {
  try {
    // Encrypt tokens
    const encryptedAccessToken = encryptToken(connectionData.accessToken);
    const encryptedRefreshToken = connectionData.refreshToken 
      ? encryptToken(connectionData.refreshToken) 
      : null;

    // Check if connection already exists for this user/provider
    const existingConnection = await db
      .select()
      .from(oauthConnection)
      .where(
        and(
          eq(oauthConnection.userId, userId),
          eq(oauthConnection.provider, connectionData.provider),
          eq(oauthConnection.providerUserId, connectionData.providerUserId)
        )
      )
      .limit(1);

    if (existingConnection.length > 0) {
      // Update existing connection
      const [updatedConnection] = await db
        .update(oauthConnection)
        .set({
          accessToken: encryptedAccessToken.encrypted,
          refreshToken: encryptedRefreshToken?.encrypted,
          encryptionIv: encryptedAccessToken.iv,
          expiresAt: connectionData.expiresAt,
          scopes: connectionData.scopes,
          providerData: connectionData.providerData,
          username: connectionData.username,
          avatarId: connectionData.avatarId,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(oauthConnection.id, existingConnection[0].id))
        .returning();

      return { success: true, connectionId: updatedConnection.id };
    } else {
      // Create new connection
      const [newConnection] = await db
        .insert(oauthConnection)
        .values({
          userId,
          avatarId: connectionData.avatarId,
          provider: connectionData.provider,
          providerUserId: connectionData.providerUserId,
          username: connectionData.username,
          accessToken: encryptedAccessToken.encrypted,
          refreshToken: encryptedRefreshToken?.encrypted,
          encryptionIv: encryptedAccessToken.iv,
          expiresAt: connectionData.expiresAt,
          scopes: connectionData.scopes,
          providerData: connectionData.providerData,
          isActive: true
        })
        .returning();

      return { success: true, connectionId: newConnection.id };
    }
  } catch (error) {
    console.error('Error saving OAuth connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get OAuth connections for a user
export async function getOAuthConnections(
  userId: string,
  provider?: 'instagram' | 'facebook' | 'shopify' | 'threads',
  avatarId?: string
): Promise<{
  success: boolean;
  connections?: Array<{
    id: string;
    provider: string;
    providerUserId: string;
    username?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scopes?: string[];
    providerData?: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  error?: string;
}> {
  try {
    // Build where conditions
    const whereConditions = [
      eq(oauthConnection.userId, userId),
      eq(oauthConnection.isActive, true)
    ];

    // Add provider filter if specified
    if (provider) {
      whereConditions.push(eq(oauthConnection.provider, provider));
    }

    // Add avatar filter if specified
    if (avatarId) {
      whereConditions.push(eq(oauthConnection.avatarId, avatarId));
    }

    const connections = await db
      .select()
      .from(oauthConnection)
      .where(and(...whereConditions));

    // Decrypt tokens and return
    const decryptedConnections = connections.map((conn: typeof oauthConnection.$inferSelect) => ({
      id: conn.id,
      provider: conn.provider,
      providerUserId: conn.providerUserId,
      username: conn.username || undefined, // Convert null to undefined
      accessToken: decryptToken(conn.accessToken, conn.encryptionIv!),
      refreshToken: conn.refreshToken 
        ? decryptToken(conn.refreshToken, conn.encryptionIv!) 
        : undefined,
      expiresAt: conn.expiresAt || undefined, // Convert null to undefined
      scopes: conn.scopes as string[],
      providerData: conn.providerData,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }));

    return { success: true, connections: decryptedConnections };
  } catch (error) {
    console.error('Error getting OAuth connections:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Revoke/deactivate OAuth connection
export async function revokeOAuthConnection(
  userId: string,
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(oauthConnection)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(oauthConnection.id, connectionId),
          eq(oauthConnection.userId, userId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error revoking OAuth connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Refresh OAuth token
export async function refreshOAuthToken(
  userId: string,
  connectionId: string,
  newAccessToken: string,
  newRefreshToken?: string,
  newExpiresAt?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    // Encrypt new tokens
    const encryptedAccessToken = encryptToken(newAccessToken);
    const encryptedRefreshToken = newRefreshToken 
      ? encryptToken(newRefreshToken) 
      : null;

    await db
      .update(oauthConnection)
      .set({
        accessToken: encryptedAccessToken.encrypted,
        refreshToken: encryptedRefreshToken?.encrypted,
        encryptionIv: encryptedAccessToken.iv,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(oauthConnection.id, connectionId),
          eq(oauthConnection.userId, userId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error refreshing OAuth token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Check if token needs refresh (expires within 5 minutes)
export function needsTokenRefresh(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}

// Legacy function to save OAuth connections to avatar table (for backward compatibility)
export async function saveOAuthConnectionToAvatar(
  avatarId: string,
  oauthConnections: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(avatar)
      .set({
        oauthConnections,
        updatedAt: new Date()
      })
      .where(eq(avatar.id, avatarId));

    return { success: true };
  } catch (error) {
    console.error('Error saving OAuth connections to avatar:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 