import * as React from 'react';
import { memo } from 'react';
import { themes } from './MobileAppDemo';
// Import the avatar creator component
import AvatarCreator from '../../../avatar-creator/avatar-creator';

interface OnboardContentProps {
  agentData?: any;
  onDataChange?: (agentData: any) => void;
  documentId?: string;
}

export const OnboardContent = memo(({ agentData, onDataChange, documentId }: OnboardContentProps) => {
  // Get the current theme from agent data or default to green
  const currentAgentTheme = agentData?.theme || 'green';
  const currentTheme = themes[currentAgentTheme as keyof typeof themes] || themes.green;

  return (
    <div className="relative space-y-6">
      <div className="space-y-6">
        {/* Unified Header */}
        <div className="text-center space-y-4">
          {/* <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
            <span className="text-2xl sm:text-3xl">🎨</span>
          </div> */}
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.light} font-mono`}>Create Your Avatar</h2>
            <p className={`${currentTheme.dim} font-mono text-sm max-w-2xl mx-auto leading-relaxed mt-2`}>
              Design a personalized avatar for your AI agent. Choose from ROM unicorns or upload your own custom image.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {(() => {
              console.log('🎨 OnboardContent rendering AvatarCreator with:', {
                documentId,
                agentDataExists: !!agentData,
                agentDataName: agentData?.name || 'none',
                agentDataDomain: agentData?.domain || 'none',
                externalApisMetadata: agentData?.externalApis,
                hasExternalApis: !!(agentData?.externalApis?.length),
                providers: agentData?.externalApis?.map((api: any) => api.provider).join(', ') || 'none',
                requiresConnection: agentData?.externalApis?.some((api: any) => api.requiresConnection) || false,
                agentDataKeys: agentData ? Object.keys(agentData) : [],
                fullAgentData: agentData ? {
                  name: agentData.name,
                  domain: agentData.domain,
                  hasExternalApis: !!(agentData.externalApis?.length),
                  externalApiProviders: agentData.externalApis?.map((api: any) => api.provider).join(', ') || 'none'
                } : null,
                // Raw debugging
                rawAgentData: agentData
              });

              // Additional check for debugging
              if (!(agentData?.externalApis?.length) && agentData?.name && agentData.name.toLowerCase().includes('instagram')) {
                console.warn('🚨 ISSUE DETECTED: Agent name suggests Instagram but no externalApis metadata found!', {
                  agentName: agentData.name,
                  agentDescription: agentData.description,
                  agentDomain: agentData.domain,
                  allKeys: Object.keys(agentData),
                  externalApis: agentData.externalApis
                });
              }

              return (
                <AvatarCreator 
                  documentId={documentId} 
                  externalApisMetadata={agentData?.externalApis || []}
                  agentData={agentData}
                  onAvatarChange={(avatarData: any) => {
                    console.log('🎨 OnboardContent - Avatar change:', {
                      documentId,
                      hasDocumentId: !!documentId,
                      documentIdType: typeof documentId,
                      avatarData: !!avatarData
                    });
                    
                    if (onDataChange && agentData) {
                      const updatedAgent = {
                        ...agentData,
                        avatar: avatarData
                      };
                      onDataChange(updatedAgent);
                    }
                  }}
                  onThemeChange={(theme: string) => {
                    console.log('🎨 OnboardContent - Theme change:', {
                      documentId,
                      hasDocumentId: !!documentId,
                      documentIdType: typeof documentId,
                      theme,
                      hasAgentData: !!agentData,
                      currentAgentTheme: agentData?.theme
                    });
                    
                    // CRITICAL FIX: Update agentData with theme (same pattern as avatar)
                    if (onDataChange && agentData) {
                      const updatedAgent = {
                        ...agentData,
                        theme: theme  // Save theme to main agentData content
                      };
                      console.log('🎨 OnboardContent - Updating agentData with theme:', {
                        previousTheme: agentData.theme,
                        newTheme: theme,
                        updatedAgent: !!updatedAgent
                      });
                      onDataChange(updatedAgent);
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}); 