import { getOAuthConnections, refreshOAuthToken, needsTokenRefresh } from './db/oauth-tokens';

// Provider-specific token refresh implementations for new providers

export async function refreshGoogleToken(
  refreshToken: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google token refresh error:', errorData);
      return { success: false, error: 'Failed to refresh Google token' };
    }

    const tokenData = await response.json();

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Google may not return new refresh token
      expiresAt: tokenData.expires_in ? 
        new Date(Date.now() + tokenData.expires_in * 1000) : 
        new Date(Date.now() + 60 * 60 * 1000) // Default 1 hour
    };
  } catch (error) {
    console.error('Google token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function refreshLinkedInToken(
  refreshToken: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LinkedIn token refresh error:', errorData);
      return { success: false, error: 'Failed to refresh LinkedIn token' };
    }

    const tokenData = await response.json();

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: tokenData.expires_in ? 
        new Date(Date.now() + tokenData.expires_in * 1000) : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Default 60 days
    };
  } catch (error) {
    console.error('LinkedIn token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Note: GitHub and Notion tokens don't expire and don't support refresh

// Provider-specific token refresh implementations
export async function refreshInstagramToken(
  refreshToken: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  try {
    const response = await fetch('https://graph.instagram.com/refresh_access_token', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const url = `https://graph.instagram.com/refresh_access_token?` + new URLSearchParams({
      grant_type: 'ig_refresh_token',
      refresh_token: refreshToken
    });

    const refreshResponse = await fetch(url);

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('Instagram token refresh error:', errorData);
      return { success: false, error: 'Failed to refresh Instagram token' };
    }

    const tokenData = await refreshResponse.json();

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Instagram may not return new refresh token
      expiresAt: tokenData.expires_in ? 
        new Date(Date.now() + tokenData.expires_in * 1000) : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Default 60 days
    };
  } catch (error) {
    console.error('Instagram token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function refreshFacebookToken(
  accessToken: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      fb_exchange_token: accessToken
    });

    const refreshResponse = await fetch(url);

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('Facebook token refresh error:', errorData);
      return { success: false, error: 'Failed to refresh Facebook token' };
    }

    const tokenData = await refreshResponse.json();

    return {
      success: true,
      accessToken: tokenData.access_token,
      expiresAt: tokenData.expires_in ? 
        new Date(Date.now() + tokenData.expires_in * 1000) : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Default 60 days
    };
  } catch (error) {
    console.error('Facebook token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function refreshThreadsToken(
  refreshToken: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  try {
    const response = await fetch('https://graph.threads.net/refresh_access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.THREADS_CLIENT_ID!,
        client_secret: process.env.THREADS_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Threads token refresh error:', errorData);
      return { success: false, error: 'Failed to refresh Threads token' };
    }

    const tokenData = await response.json();

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: tokenData.expires_in ? 
        new Date(Date.now() + tokenData.expires_in * 1000) : 
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // Default 60 days
    };
  } catch (error) {
    console.error('Threads token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Shopify tokens don't expire, so no refresh needed
export async function refreshShopifyToken(): Promise<{ 
  success: boolean; 
  error?: string; 
}> {
  return { 
    success: true 
  }; // Shopify tokens don't expire unless revoked
}

// Main token refresh function
export async function refreshProviderToken(
  provider: 'instagram' | 'facebook' | 'shopify' | 'threads' | 'google' | 'github-oauth' | 'linkedin' | 'notion',
  accessToken: string,
  refreshToken?: string
): Promise<{ 
  success: boolean; 
  accessToken?: string; 
  refreshToken?: string; 
  expiresAt?: Date;
  error?: string; 
}> {
  switch (provider) {
    case 'google':
      if (!refreshToken) {
        return { success: false, error: 'Google refresh token is required' };
      }
      return refreshGoogleToken(refreshToken);
      
    case 'github-oauth':
      // GitHub tokens don't expire and don't support refresh
      return { 
        success: true, 
        accessToken, 
        error: 'GitHub tokens do not expire and do not need refresh' 
      };
      
    case 'linkedin':
      if (!refreshToken) {
        return { success: false, error: 'LinkedIn refresh token is required' };
      }
      return refreshLinkedInToken(refreshToken);
      
    case 'notion':
      // Notion tokens don't expire and don't support refresh
      return { 
        success: true, 
        accessToken, 
        error: 'Notion tokens do not expire and do not need refresh' 
      };
      
    case 'instagram':
      if (!refreshToken) {
        return { success: false, error: 'Instagram refresh token is required' };
      }
      return refreshInstagramToken(refreshToken);
      
    case 'facebook':
      return refreshFacebookToken(accessToken);
      
    case 'threads':
      if (!refreshToken) {
        return { success: false, error: 'Threads refresh token is required' };
      }
      return refreshThreadsToken(refreshToken);
      
    case 'shopify':
      return refreshShopifyToken();
      
    default:
      return { success: false, error: 'Unsupported provider' };
  }
}

// Auto-refresh tokens for a user
export async function autoRefreshUserTokens(
  userId: string
): Promise<{ 
  success: boolean; 
  refreshedCount: number; 
  errors: string[]; 
}> {
  try {
    const { success, connections, error } = await getOAuthConnections(userId);
    
    if (!success || !connections) {
      return { 
        success: false, 
        refreshedCount: 0, 
        errors: [error || 'Failed to get connections'] 
      };
    }

    let refreshedCount = 0;
    const errors: string[] = [];

    // Check each connection for token expiry
    for (const connection of connections) {
      if (needsTokenRefresh(connection.expiresAt)) {
        console.log(`Refreshing token for ${connection.provider} connection ${connection.id}`);
        
        const refreshResult = await refreshProviderToken(
          connection.provider as 'instagram' | 'facebook' | 'shopify' | 'threads' | 'google' | 'github-oauth' | 'linkedin' | 'notion',
          connection.accessToken,
          connection.refreshToken
        );

        if (refreshResult.success && refreshResult.accessToken) {
          // Update the token in the database
          const updateResult = await refreshOAuthToken(
            userId,
            connection.id,
            refreshResult.accessToken,
            refreshResult.refreshToken,
            refreshResult.expiresAt
          );

          if (updateResult.success) {
            refreshedCount++;
            console.log(`Successfully refreshed ${connection.provider} token for user ${userId}`);
          } else {
            errors.push(`Failed to save refreshed ${connection.provider} token: ${updateResult.error}`);
          }
        } else {
          errors.push(`Failed to refresh ${connection.provider} token: ${refreshResult.error}`);
        }
      }
    }

    return {
      success: true,
      refreshedCount,
      errors
    };
  } catch (error) {
    console.error('Auto-refresh tokens error:', error);
    return {
      success: false,
      refreshedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Schedule token refresh (can be called by cron job)
export async function scheduleTokenRefresh(): Promise<void> {
  try {
    // This would typically get all users with OAuth connections
    // For now, we'll create a simple implementation
    console.log('Token refresh scheduler started');
    
    // In a real implementation, you would:
    // 1. Get all users with OAuth connections
    // 2. Check which tokens need refresh
    // 3. Refresh them automatically
    // 4. Log results
    
    console.log('Token refresh scheduler completed');
  } catch (error) {
    console.error('Token refresh scheduler error:', error);
  }
} 