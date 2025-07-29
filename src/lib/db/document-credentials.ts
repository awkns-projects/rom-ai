import crypto from 'crypto';
import { updateDocument, getDocumentById } from './queries';
import { encryptToken, decryptToken, getOAuthConnections } from './oauth-tokens';

export interface ExternalApiCredential {
  provider: string;
  credentialType: 'oauth' | 'api_key';
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: Date;
  scopes?: string[];
  encryptionIv?: string;
}

export interface DocumentCredentials {
  externalApiCredentials: ExternalApiCredential[];
  lastUpdated: string;
}

/**
 * Securely store external API credentials in document metadata
 */
export async function storeDocumentCredentials(
  documentId: string,
  userId: string,
  credentials: ExternalApiCredential[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Encrypt sensitive credential data
    const encryptedCredentials = credentials.map(cred => {
      const encrypted: ExternalApiCredential = {
        provider: cred.provider,
        credentialType: cred.credentialType,
        expiresAt: cred.expiresAt,
        scopes: cred.scopes
      };

      if (cred.accessToken) {
        const encryptedAccessToken = encryptToken(cred.accessToken);
        encrypted.accessToken = encryptedAccessToken.encrypted;
        encrypted.encryptionIv = encryptedAccessToken.iv;
      }

      if (cred.refreshToken) {
        const encryptedRefreshToken = encryptToken(cred.refreshToken);
        encrypted.refreshToken = encryptedRefreshToken.encrypted;
        encrypted.encryptionIv = encrypted.encryptionIv || encryptedRefreshToken.iv;
      }

      if (cred.apiKey) {
        const encryptedApiKey = encryptToken(cred.apiKey);
        encrypted.apiKey = encryptedApiKey.encrypted;
        encrypted.encryptionIv = encrypted.encryptionIv || encryptedApiKey.iv;
      }

      return encrypted;
    });

    // Get current document to merge with existing metadata
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const currentMetadata = (document.metadata as any) || {};
    const credentialData: DocumentCredentials = {
      externalApiCredentials: encryptedCredentials,
      lastUpdated: new Date().toISOString()
    };

    // Update document with encrypted credentials
    await updateDocument({
      id: documentId,
      userId,
      metadata: {
        ...currentMetadata,
        credentials: credentialData
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error storing document credentials:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Retrieve and decrypt external API credentials from document metadata
 */
export async function getDocumentCredentials(
  documentId: string,
  userId: string
): Promise<{ success: boolean; credentials?: ExternalApiCredential[]; error?: string }> {
  try {
    const document = await getDocumentById({ id: documentId });
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    const credentialData = (document.metadata as any)?.credentials as DocumentCredentials;
    if (!credentialData?.externalApiCredentials) {
      return { success: true, credentials: [] };
    }

    // Decrypt sensitive credential data
    const decryptedCredentials = credentialData.externalApiCredentials.map(cred => {
      const decrypted: ExternalApiCredential = {
        provider: cred.provider,
        credentialType: cred.credentialType,
        expiresAt: cred.expiresAt,
        scopes: cred.scopes
      };

      if (cred.accessToken && cred.encryptionIv) {
        decrypted.accessToken = decryptToken(cred.accessToken, cred.encryptionIv);
      }

      if (cred.refreshToken && cred.encryptionIv) {
        decrypted.refreshToken = decryptToken(cred.refreshToken, cred.encryptionIv);
      }

      if (cred.apiKey && cred.encryptionIv) {
        decrypted.apiKey = decryptToken(cred.apiKey, cred.encryptionIv);
      }

      return decrypted;
    });

    return { success: true, credentials: decryptedCredentials };
  } catch (error) {
    console.error('Error retrieving document credentials:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get OAuth connections for a document
 */
export async function getDocumentOAuthConnections(
  documentId: string,
  userId: string
): Promise<{ success: boolean; connections?: any[]; error?: string }> {
  try {
    const result = await getOAuthConnections(userId, undefined, documentId);
    return result;
  } catch (error) {
    console.error('Error getting document OAuth connections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate environment variables object for action execution
 */
export function credentialsToEnvVars(credentials: ExternalApiCredential[]): Record<string, string> {
  const envVars: Record<string, string> = {};

  credentials.forEach(cred => {
    const providerPrefix = cred.provider.toUpperCase().replace('-', '_');
    
    if (cred.credentialType === 'oauth') {
      if (cred.accessToken) {
        envVars[`${providerPrefix}_ACCESS_TOKEN`] = cred.accessToken;
      }
      if (cred.refreshToken) {
        envVars[`${providerPrefix}_REFRESH_TOKEN`] = cred.refreshToken;
      }
    } else if (cred.credentialType === 'api_key' && cred.apiKey) {
      envVars[`${providerPrefix}_API_KEY`] = cred.apiKey;
    }
  });

  return envVars;
}

/**
 * Extract credentials from agent data external APIs configuration
 */
export function extractCredentialsFromAgentData(
  agentData: any,
  oauthConnections: any[] = [],
  documentId?: string
): ExternalApiCredential[] {
  if (!agentData.externalApis?.length) {
    return [];
  }

  return agentData.externalApis.map((api: any) => {
    // Try to find matching OAuth connection
    const oauthConnection = oauthConnections.find(
      conn => conn.provider === api.provider && conn.isActive
    );

    const credential: ExternalApiCredential = {
      provider: api.provider,
      credentialType: api.connectionType
    };

    if (oauthConnection) {
      credential.accessToken = oauthConnection.accessToken;
      credential.refreshToken = oauthConnection.refreshToken;
      credential.expiresAt = oauthConnection.expiresAt;
      credential.scopes = oauthConnection.scopes;
    }

    return credential;
  });
} 