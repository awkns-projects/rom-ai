import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { AgentAction } from '../../types';

interface AuthStatus {
  provider: string;
  connectionType: string;
  isAuthenticated: boolean;
  isExpired: boolean;
  hasConnection: boolean;
  username?: string;
  scopes?: string[];
  expiresAt?: Date;
  lastUpdated?: Date;
  requiredByActions?: boolean;
}

interface AuthStatusResponse {
  success: boolean;
  authStatus: AuthStatus[];
  summary: {
    totalProviders: number;
    authenticatedProviders: number;
    expiredProviders: number;
    missingProviders: number;
    allAuthenticated: boolean;
  };
}

interface AuthenticationStatusProps {
  documentId?: string;
  action: AgentAction;
}

const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    'gmail': '📧',
    'google': '🔍',
    'shopify': '🛍️',
    'stripe': '💳',
    'slack': '💬',
    'notion': '📝',
    'facebook': '📘',
    'instagram': '📸',
    'linkedin': '💼',
    'threads': '🧵',
    'github': '🐙',
    'salesforce': '☁️',
    'hubspot': '🎯',
    'microsoft-teams': '👥'
  };
  return icons[provider] || '🔌';
};

const getProviderDisplayName = (provider: string): string => {
  const names: Record<string, string> = {
    'gmail': 'Gmail',
    'google': 'Google',
    'shopify': 'Shopify',
    'stripe': 'Stripe',
    'slack': 'Slack',
    'notion': 'Notion',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'linkedin': 'LinkedIn',
    'threads': 'Threads',
    'github': 'GitHub',
    'salesforce': 'Salesforce',
    'hubspot': 'HubSpot',
    'microsoft-teams': 'Microsoft Teams'
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
};

export function AuthenticationStatus({ documentId, action }: AuthenticationStatusProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    fetchAuthStatus();
  }, [documentId]);

  const fetchAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agent/auth-status?documentId=${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch authentication status');
      }

      const data: AuthStatusResponse = await response.json();
      setAuthStatus(data);
    } catch (err) {
      console.error('Error fetching auth status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Extract required providers from action
  const getRequiredProviders = (): Set<string> => {
    const providers = new Set<string>();
    
    if (action.externalApiProvider) {
      providers.add(action.externalApiProvider);
    }
    
    action.pseudoSteps?.forEach(step => {
      if (step.oauthTokens?.provider) {
        providers.add(step.oauthTokens.provider);
      }
      if (step.apiKeys?.provider) {
        providers.add(step.apiKeys.provider);
      }
    });
    
    return providers;
  };

  const requiredProviders = getRequiredProviders();

  if (loading) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <div className="text-emerald-300 font-mono text-xs">
          🔄 Checking authentication status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div className="text-red-300 font-mono text-xs">
          ⚠️ Unable to check authentication status: {error}
        </div>
      </div>
    );
  }

  // If no external APIs required, show success
  if (requiredProviders.size === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <div className="text-emerald-300 font-mono text-xs">
          ✅ No external API authentication required for this action
        </div>
      </div>
    );
  }

  if (!authStatus) {
    return null;
  }

  const relevantStatus = authStatus.authStatus.filter(status => 
    requiredProviders.has(status.provider)
  );

  const allAuthenticated = relevantStatus.length > 0 && relevantStatus.every(s => s.isAuthenticated);
  const hasExpired = relevantStatus.some(s => s.isExpired);
  const hasMissing = Array.from(requiredProviders).some(provider => 
    !relevantStatus.find(s => s.provider === provider)?.hasConnection
  );

  return (
    <div className={`border rounded-lg p-3 ${
      allAuthenticated && !hasExpired
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-amber-500/10 border-amber-500/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`font-mono text-sm font-semibold ${
          allAuthenticated && !hasExpired ? 'text-emerald-300' : 'text-amber-300'
        }`}>
          🔐 Authentication Status
        </div>
        {!allAuthenticated && (
          <Button
            onClick={() => window.open('/chat', '_blank')}
            size="sm"
            className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
          >
            Setup Auth
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {Array.from(requiredProviders).map(provider => {
          const status = relevantStatus.find(s => s.provider === provider);
          const isAuthenticated = status?.isAuthenticated || false;
          const isExpired = status?.isExpired || false;
          const hasConnection = status?.hasConnection || false;

          return (
            <div key={provider} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span>{getProviderIcon(provider)}</span>
                <span className="font-mono text-gray-300">
                  {getProviderDisplayName(provider)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <span className="text-emerald-300 font-mono">✅ Connected</span>
                ) : isExpired ? (
                  <span className="text-orange-300 font-mono">⏰ Expired</span>
                ) : hasConnection ? (
                  <span className="text-amber-300 font-mono">⚠️ Issues</span>
                ) : (
                  <span className="text-red-300 font-mono">❌ Not Connected</span>
                )}
                {status?.username && (
                  <span className="text-gray-400 text-xs">
                    ({status.username})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!allAuthenticated && (
        <div className="mt-2 pt-2 border-t border-amber-500/20">
          <div className="text-amber-300 font-mono text-xs">
            {hasMissing && '⚠️ Some external API connections are missing'}
            {hasExpired && '⏰ Some connections have expired'}
            {!hasMissing && !hasExpired && '🔄 Authentication needs to be refreshed'}
          </div>
        </div>
      )}
    </div>
  );
} 