import 'server-only';

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Get encryption key from environment variable or generate a fallback
const getEncryptionKey = (): string => {
  const envKey = process.env.API_KEY_ENCRYPTION_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Fallback: use AUTH_SECRET as base for encryption key
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret) {
    // Create a consistent 32-byte key from AUTH_SECRET
    return createHash('sha256').update(authSecret + 'api-keys').digest('hex').slice(0, 32);
  }
  
  // Development fallback
  console.warn('⚠️ No API_KEY_ENCRYPTION_KEY or AUTH_SECRET found. Using development fallback.');
  return 'dev-fallback-key-32-chars-long!';
};

const ENCRYPTION_KEY = getEncryptionKey();
const KEY_HASH = createHash('sha256').update(ENCRYPTION_KEY).digest();

/**
 * Encrypt an API key for secure storage
 */
function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', KEY_HASH, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an API key from storage
 */
function decryptApiKey(encryptedApiKey: string): string {
  const [ivHex, encrypted] = encryptedApiKey.split(':');
  
  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted API key format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', KEY_HASH, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Save user's API keys (encrypted)
 */
export async function saveUserApiKeys(
  userId: string,
  apiKeys: {
    openaiApiKey?: string;
    xaiApiKey?: string;
  }
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (apiKeys.openaiApiKey) {
      updateData.openaiApiKey = encryptApiKey(apiKeys.openaiApiKey);
    }

    if (apiKeys.xaiApiKey) {
      updateData.xaiApiKey = encryptApiKey(apiKeys.xaiApiKey);
    }

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save API keys');
  }
}

/**
 * Get user's decrypted API keys
 */
export async function getUserApiKeys(
  userId: string
): Promise<{
  openaiApiKey?: string;
  xaiApiKey?: string;
}> {
  try {
    const [userData] = await db
      .select({
        openaiApiKey: user.openaiApiKey,
        xaiApiKey: user.xaiApiKey,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!userData) {
      return {};
    }

    const result: { openaiApiKey?: string; xaiApiKey?: string } = {};

    if (userData.openaiApiKey) {
      try {
        result.openaiApiKey = decryptApiKey(userData.openaiApiKey);
      } catch (error) {
        console.error('Failed to decrypt OpenAI API key:', error);
      }
    }

    if (userData.xaiApiKey) {
      try {
        result.xaiApiKey = decryptApiKey(userData.xaiApiKey);
      } catch (error) {
        console.error('Failed to decrypt xAI API key:', error);
      }
    }

    return result;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get API keys');
  }
}

/**
 * Delete user's API keys
 */
export async function deleteUserApiKeys(
  userId: string,
  providers: ('openai' | 'xai')[]
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (providers.includes('openai')) {
      updateData.openaiApiKey = null;
    }

    if (providers.includes('xai')) {
      updateData.xaiApiKey = null;
    }

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete API keys');
  }
}

/**
 * Check if user has API keys for specific providers
 */
export async function hasUserApiKeys(
  userId: string
): Promise<{
  hasOpenaiKey: boolean;
  hasXaiKey: boolean;
}> {
  try {
    const [userData] = await db
      .select({
        openaiApiKey: user.openaiApiKey,
        xaiApiKey: user.xaiApiKey,
      })
      .from(user)
      .where(eq(user.id, userId));

    return {
      hasOpenaiKey: !!userData?.openaiApiKey,
      hasXaiKey: !!userData?.xaiApiKey,
    };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to check API keys');
  }
} 