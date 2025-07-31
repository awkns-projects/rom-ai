"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import MatrixBox from "./matrix-box"
import { CompositeUnicorn } from "@/components/composite-unicorn"
import { AvatarList } from "@/components/avatar-list"
import { useAvatars, type Avatar } from "@/hooks/use-avatar"
import { OnboardContent } from "@/artifacts/agent/components/OnboardContent"
import { MobileAppDemoWrapper } from "@/artifacts/agent/components/MobileAppDemo"
// Avatar and theme data is now stored directly in document content via API

/**
 * Save avatar creator data directly to document content
 */
async function saveAvatarCreatorState(
  documentId: string,
  state: {
    avatarData?: any;
    step?: number;
    theme?: string;
    name?: string;
  }
): Promise<void> {
  try {
    console.log('🎨 Saving avatar creator state to document content:', { documentId, state });
    
    // Validate documentId before making the request
    if (!documentId || documentId === 'init' || documentId.trim() === '') {
      throw new Error(`Invalid documentId: ${documentId}. Cannot save avatar state without a valid document ID.`);
    }
    
    // First, try to get the existing document
    const getResponse = await fetch(`/api/document?id=${documentId}`);
    let existingDocument = null;
    let existingContent = null;

    if (getResponse.ok) {
      const documents = await getResponse.json();
      existingDocument = Array.isArray(documents) ? documents[0] : documents;
      
      if (existingDocument?.content) {
        try {
          existingContent = JSON.parse(existingDocument.content);
        } catch (e) {
          console.warn('Failed to parse existing document content, creating new structure');
          existingContent = {};
        }
      }
    }

    // Prepare the updated content
    const updatedContent = {
      name: 'New Agent',
      description: '',
      domain: '',
      models: [],
      enums: [],
      actions: [],
      schedules: [],
      createdAt: new Date().toISOString(),
      ...existingContent, // Preserve existing content
      // Update with new state data
      ...(state.name && { name: state.name }),
      ...(state.avatarData && { avatar: state.avatarData }),
      ...(state.theme && { theme: state.theme }),
    };

    const title = state.name || existingContent?.name || 'AI Agent System';

    // Update the document content
    const response = await fetch(`/api/document?id=${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content: JSON.stringify(updatedContent, null, 2),
        kind: 'agent',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to save avatar creator state:', errorText);
      throw new Error(`Failed to save avatar creator state: ${response.status} ${errorText}`);
    }

    console.log('✅ Avatar creator state saved successfully to document content');
  } catch (error) {
    console.error('❌ Error saving avatar creator state:', error);
    throw error;
  }
}

/**
 * Load avatar creator data from document content
 */
async function loadAvatarCreatorState(
  documentId: string
): Promise<{
  avatarData?: any;
  step?: number;
  theme?: string;
  name?: string;
} | null> {
  try {
    console.log('🔍 Loading avatar creator state from document content:', documentId);
    
    const response = await fetch(`/api/document?id=${documentId}`);
    if (!response.ok) {
      console.log('📭 No existing document found or access denied');
      return null;
    }

    const documents = await response.json();
    const document = Array.isArray(documents) ? documents[0] : documents;
    
    if (!document?.content) {
      console.log('📭 No document content found');
      return null;
    }

    let agentData;
    try {
      agentData = JSON.parse(document.content);
    } catch (e) {
      console.error('❌ Failed to parse document content:', e);
      return null;
    }

    const avatarState = {
      avatarData: agentData.avatar || null,
      theme: agentData.theme || null,
      name: agentData.name || null,
      step: 1, // Default step if not stored
    };
    
    console.log('📥 Loaded avatar creator state from document content:', avatarState);
    return avatarState;
  } catch (error) {
    console.error('❌ Error loading avatar creator state:', error);
    return null;
  }
}

type AvatarType = "rom-unicorn" | "custom"
type RomUnicornType = "default" | "random"
type CustomType = "upload" | "wallet"

interface UnicornParts {
  body: string
  hair: string
  eyes: string
  mouth: string
  accessory: string
}

interface OAuthConnection {
  provider: 'instagram' | 'facebook' | 'shopify' | 'threads' | 'google' | 'github-oauth' | 'linkedin' | 'notion'
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  userId?: string
  username?: string
  storeUrl?: string // For Shopify
  isActive: boolean
  connectedAt: string
}

interface AvatarData {
  accessToken?: string
  isAuthenticated?: boolean
  shopifyStore?: string
  name: string
  personality?: string
  characterNames?: string
  type: AvatarType
  romUnicornType?: RomUnicornType
  customType?: CustomType
  uploadedImage?: string
  selectedStyle?: string
  connectedWallet?: string
  selectedNFT?: string
  unicornParts?: UnicornParts
  oauthConnections?: OAuthConnection[]
}

interface AvatarCreatorProps {
  documentId?: string
  externalApisMetadata?: Array<{
    provider: string;
    requiresConnection: boolean;
    connectionType: 'oauth' | 'api_key' | 'none';
    primaryUseCase: string;
    requiredScopes: string[];
    priority: 'primary' | 'secondary';
  }>;
  agentData?: any;
  onAvatarChange?: (avatarData: any) => void;
  onThemeChange?: (theme: string) => void; // ADDED: Dedicated theme change callback
}

const oauthProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: '📧',
    color: 'from-red-500 to-orange-500',
    description: 'Connect Google (Gmail, Drive, Calendar)',
    scopes: ['email', 'profile', 'drive', 'calendar'],
    authUrl: 'https://accounts.google.com/o/oauth2/auth'
  },
  {
    id: 'github-oauth',
    name: 'GitHub',
    icon: '🐙',
    color: 'from-gray-700 to-gray-900',
    description: 'Connect your GitHub repositories',
    scopes: ['repo', 'user:email', 'read:org'],
    authUrl: 'https://github.com/login/oauth/authorize'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'from-blue-600 to-blue-700',
    description: 'Connect your LinkedIn profile',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    color: 'from-gray-800 to-black',
    description: 'Connect your Notion workspace',
    scopes: ['read_content', 'write_content'],
    authUrl: 'https://api.notion.com/v1/oauth/authorize'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'from-pink-500 to-purple-600',
    description: 'Connect your Instagram account',
    scopes: ['user_profile', 'user_media'],
    authUrl: 'https://api.instagram.com/oauth/authorize'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-500 to-blue-600',
    description: 'Connect your Facebook account',
    scopes: ['public_profile', 'pages_read_engagement'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    color: 'from-green-500 to-emerald-600',
    description: 'Connect your Shopify store',
    scopes: ['read_products', 'write_products', 'read_orders'],
    authUrl: 'https://[shop].myshopify.com/admin/oauth/authorize'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'from-gray-500 to-gray-600',
    description: 'Connect your Threads account',
    scopes: ['threads_basic', 'threads_content_publish'],
    authUrl: 'https://threads.net/oauth/authorize'
  }
] as const

// Mapping between Step 0 analysis provider names and OAuth provider IDs
const providerMapping: Record<string, string> = {
  'gmail': 'google',
  'google': 'google',
  'google-drive': 'google',
  'google-calendar': 'google',
  'github': 'github-oauth',
  'github-oauth': 'github-oauth',
  'linkedin': 'linkedin',
  'notion': 'notion',
  'instagram': 'instagram',
  'facebook': 'facebook',
  'shopify': 'shopify',
  'threads': 'threads',
  'slack': 'slack', // Note: Slack is not in the current providers list but could be added
  'stripe': 'stripe', // Note: Stripe uses API key, not OAuth
  'salesforce': 'salesforce', // Note: Salesforce is not in current providers list
};

// Function to get relevant OAuth providers based on external APIs metadata
const getRelevantOAuthProviders = (externalApisMetadata?: AvatarCreatorProps['externalApisMetadata']) => {
  // If no external APIs metadata or empty array, show no OAuth providers
  if (!externalApisMetadata || externalApisMetadata.length === 0) {
    console.log('🔍 No external APIs required or no metadata provided - hiding OAuth providers');
    return [];
  }

  const relevantProviders: any[] = [];
  
  // Process each external API
  for (const apiMetadata of externalApisMetadata) {
    // Skip if API doesn't require connection or doesn't use OAuth
    if (!apiMetadata.requiresConnection || apiMetadata.connectionType !== 'oauth') {
      console.log(`🔍 External API "${apiMetadata.provider}" uses ${apiMetadata.connectionType} or doesn't require connection - skipping OAuth`);
      continue;
    }

    // Map external API provider to OAuth provider
    const mappedProviderId = providerMapping[apiMetadata.provider.toLowerCase()];
    
    if (!mappedProviderId) {
      console.warn(`⚠️ No OAuth provider mapping found for "${apiMetadata.provider}" - skipping`);
      continue;
    }

    // Find the relevant OAuth provider
    const relevantProvider = oauthProviders.find(provider => 
      provider.id === mappedProviderId
    );

    if (!relevantProvider) {
      console.warn(`⚠️ OAuth provider "${mappedProviderId}" not found in available providers`);
      continue;
    }

    // Avoid duplicates
    if (!relevantProviders.find(p => p.id === relevantProvider.id)) {
      console.log(`✅ Found relevant OAuth provider for "${apiMetadata.provider}": ${relevantProvider.name}`, {
        provider: apiMetadata.provider,
        priority: apiMetadata.priority,
        mappedTo: mappedProviderId,
        providerName: relevantProvider.name,
        primaryUseCase: apiMetadata.primaryUseCase
      });
      
      relevantProviders.push(relevantProvider);
    }
  }

  return relevantProviders;
};

const artStyles = [
  { id: "ghibli", name: "Studio Ghibli", description: "Magical anime style" },
  { id: "dragonball", name: "Dragon Ball", description: "Bold anime style" },
  { id: "pixar", name: "Pixar 3D", description: "Colorful 3D style" },
  { id: "disney", name: "Disney Classic", description: "Classic animation" },
  { id: "manga", name: "Manga", description: "Black & white comic" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Futuristic neon" },
  { id: "watercolor", name: "Watercolor", description: "Artistic painting" },
  { id: "cartoon", name: "Cartoon", description: "Fun cartoon style" },
]

const facialExpressions = [
  { emoji: "😊", name: "Happy", description: "Joyful smile" },
  { emoji: "😎", name: "Cool", description: "Confident look" },
  { emoji: "🤔", name: "Thoughtful", description: "Contemplative" },
  { emoji: "😴", name: "Sleepy", description: "Relaxed" },
  { emoji: "😮", name: "Surprised", description: "Wide-eyed" },
  { emoji: "😤", name: "Determined", description: "Focused" },
  { emoji: "🥰", name: "Loving", description: "Affectionate" },
  { emoji: "😏", name: "Smirk", description: "Playful" },
]

// Unicorn parts configuration
const unicornParts = {
  bodies: ["body.png", "body_h.png"],
  hair: ["hair_blue.png", "hair_g.png"],
  eyes: ["eye_h.png", "eye_heart.png"],
  mouths: ["m_.png", "m_ice.png"],
  accessories: ["corn_ice1.png", "corn_ice2.png"],
}

// Function to generate random unicorn parts
const generateRandomUnicorn = (): UnicornParts => {
  const randomBody = unicornParts.bodies[Math.floor(Math.random() * unicornParts.bodies.length)]
  const randomHair = unicornParts.hair[Math.floor(Math.random() * unicornParts.hair.length)]
  const randomEyes = unicornParts.eyes[Math.floor(Math.random() * unicornParts.eyes.length)]
  const randomMouth = unicornParts.mouths[Math.floor(Math.random() * unicornParts.mouths.length)]
  const randomAccessory = unicornParts.accessories[Math.floor(Math.random() * unicornParts.accessories.length)]

  return {
    body: randomBody,
    hair: randomHair,
    eyes: randomEyes,
    mouth: randomMouth,
    accessory: randomAccessory,
  }
}

export default function AvatarCreator({ documentId, externalApisMetadata, agentData, onAvatarChange, onThemeChange }: AvatarCreatorProps = {}) {
  const [step, setStep] = useState(1)
  const [currentTheme, setCurrentTheme] = useState<string>('green'); // Will be updated from saved state or agentData
  const [showMatrixBox, setShowMatrixBox] = useState(false) // ADDED: Explicit Matrix Box control - will be set in useEffect
  // Initialize avatar data - will be updated from database if available
  const [avatarData, setAvatarData] = useState<AvatarData>(() => {
    return {
      isAuthenticated: false,
      name: agentData?.name || "",
      type: "rom-unicorn",
      romUnicornType: "default",
      customType: "upload",
      oauthConnections: [],
    };
  })
  
  // Track if we've loaded from database
  const [hasLoadedFromDatabase, setHasLoadedFromDatabase] = useState(false)

  // Get filtered OAuth providers based on external APIs metadata
  const relevantOAuthProviders = getRelevantOAuthProviders(externalApisMetadata);
  
  // Debug logging
  useEffect(() => {
    console.log('🎨 AvatarCreator - External APIs Metadata:', {
      externalApisMetadata,
      relevantProvidersCount: relevantOAuthProviders.length,
      relevantProviders: relevantOAuthProviders.map(p => p.name)
    });
  }, [externalApisMetadata, relevantOAuthProviders]);

  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([])
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false) // ADDED: Track regeneration state

  // Avatar management hooks
  const { avatars, createAvatar: createAvatarInDB, setActiveAvatar } = useAvatars(documentId)

  // Function to explicitly sync current avatar data to main agent content
  const syncToMainContent = useCallback(async () => {
    console.log('🔄 Syncing avatar and theme data to main agent content...');
    
    let syncedAvatar = false;
    let syncedTheme = false;
    
    // Convert avatar data to agent avatar format
    const agentAvatarData = {
      type: avatarData.type,
      unicornParts: avatarData.unicornParts,
      customType: avatarData.customType,
      uploadedImage: avatarData.uploadedImage,
      selectedNFT: avatarData.selectedNFT,
    };
    
    // Update the main agent data through the callback
    if (onAvatarChange) {
      onAvatarChange(agentAvatarData);
      console.log('✅ Avatar data synced to main agent content');
      syncedAvatar = true;
    } else {
      console.warn('⚠️ No onAvatarChange callback available');
    }
    
    // Sync current theme
    if (onThemeChange && currentTheme) {
      console.log('🎨 Syncing current theme to main content:', currentTheme);
      onThemeChange(currentTheme);
      console.log('✅ Theme synced to main agent content');
      syncedTheme = true;
    } else {
      console.warn('⚠️ No onThemeChange callback or current theme available');
    }
    
    if (syncedAvatar || syncedTheme) {
      const syncedItems = [];
      if (syncedAvatar) syncedItems.push('Avatar');
      if (syncedTheme) syncedItems.push('Theme');
      
      console.log('✅ All data synced to main agent content');
      alert(`✅ ${syncedItems.join(' and ')} changes saved successfully!`);
    } else {
      console.warn('⚠️ No data could be synced');
      alert('⚠️ Could not save changes. Please try again.');
    }
    
    return syncedAvatar || syncedTheme;
  }, [avatarData, onAvatarChange, currentTheme, onThemeChange]);

  // Function to explicitly sync current theme to main agent content
  const syncThemeToMainContent = useCallback((theme: string) => {
    console.log('🎨 Syncing theme to main agent content:', theme);
    
    if (onThemeChange) {
      onThemeChange(theme);
      console.log('✅ Theme synced to main agent content');
      return true;
    } else {
      console.warn('⚠️ No onThemeChange callback available');
      return false;
    }
  }, [onThemeChange]);

  // Auto-save functionality - now saves to both database and agent data
  const saveToDatabase = useCallback(async (data: AvatarData, currentStep: number, updateContent = false) => {
    console.log('💾 Saving avatar data:', { 
      hasDocumentId: !!documentId,
      documentId, // ADDED: Log actual documentId value
      documentIdType: typeof documentId, // ADDED: Log documentId type
      hasOnAvatarChange: !!onAvatarChange,
      avatarName: data.name, 
      step: currentStep,
      type: data.type,
      hasConnections: data.oauthConnections?.length || 0,
      updateContent, // ADDED: Flag to control whether to update main content
      // ADDED: Theme debugging
      currentTheme,
      themeToSave: currentTheme,
      themeType: typeof currentTheme
    });
    
    // Convert avatar data to agent avatar format
    const agentAvatarData = {
      type: data.type,
      unicornParts: data.unicornParts,
      customType: data.customType,
      uploadedImage: data.uploadedImage,
      selectedNFT: data.selectedNFT,
    };
    
    // MODIFIED: Only update the main agent data if explicitly requested
    if (updateContent && onAvatarChange) {
      onAvatarChange(agentAvatarData);
      console.log('✅ Avatar data updated in main agent content');
    } else {
      console.log('⚪ Skipping main content update (metadata only)');
    }
    
    // Enhanced database save with better error handling
    if (documentId && documentId !== 'init') {
      try {
        console.log('🔍 SAVE DEBUG - Attempting database save:', {
          documentId,
          endpoint: `/api/document?id=${documentId}`,
          isValidDocumentId: typeof documentId === 'string' && documentId.length > 0 && documentId !== 'init'
        });
        
        await saveAvatarCreatorState(documentId, {
          avatarData: data,
          step: currentStep,
          // CRITICAL FIX: Include theme data in database save
          theme: currentTheme,
          // Include name for direct storage in document content
          name: data.name,
        });
        console.log('✅ Avatar data and theme saved to database metadata successfully:', {
          hasTheme: !!currentTheme,
          theme: currentTheme
        });
        
        // Clear any previous error state
        setHasUnsavedChanges(false);
        
      } catch (error) {
        console.error("❌ Failed to save to database metadata:", error);
        console.error("🔍 SAVE ERROR DEBUG:", {
          documentId,
          documentIdValid: !!(documentId && documentId !== 'init'),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          endpoint: `/api/document?id=${documentId}`,
          suggestion: "The save function now includes retry logic and document creation"
        });
        
        // Don't throw the error - let the user continue working
        // The retry mechanism in saveAvatarCreatorState will handle most cases
        console.log('⚠️ Avatar save failed, but user can continue working. Data will be retried automatically.');
        
        // Set a flag to indicate unsaved changes
        setHasUnsavedChanges(true);
      }
    } else {
      console.log('⚪ Skipping database save - no valid document ID yet:', {
        documentId,
        isUndefined: documentId === undefined,
        isNull: documentId === null,
        isInit: documentId === 'init',
        isEmpty: documentId === '',
        actualValue: JSON.stringify(documentId),
        suggestion: "Document might still be initializing - this is normal for new conversations"
      });
      
      // For missing documentId, still update the main content
      if (onAvatarChange) {
        onAvatarChange(agentAvatarData);
        console.log('✅ Avatar data updated in main content (no database save)');
      }
      
      // Still mark as saved if we updated the main content
      setHasUnsavedChanges(false);
         }
     
     setLastSaved(new Date())
   }, [documentId, onAvatarChange, currentTheme])

  // Load from database on mount, then merge with agentData if available
  useEffect(() => {
    if (!documentId || documentId === 'init') return;
    
    const loadSavedData = async () => {
      try {
        const savedState = await loadAvatarCreatorState(documentId);
        
        // Start with default data
        let finalAvatarData: AvatarData = {
          isAuthenticated: false,
          name: agentData?.name || "",
          type: "rom-unicorn",
          romUnicornType: "default",
          customType: "upload",
          oauthConnections: [],
        };
        
        // If we have saved state, use it
        if (savedState?.avatarData) {
          finalAvatarData = { ...finalAvatarData, ...savedState.avatarData };
          // FIXED: Always start on step 1 (Avatar tab) for better UX instead of restoring saved step
          // setStep(1);
          console.log("✅ Restored avatar from database (starting on step 1):", {
            type: finalAvatarData.type,
            hasUnicornParts: !!finalAvatarData.unicornParts,
            hasUploadedImage: !!finalAvatarData.uploadedImage
          });
        }
        // If no saved state but we have agentData with avatar, use that
        else if (agentData?.avatar) {
          finalAvatarData = {
            ...finalAvatarData,
            name: agentData.name || "",
            type: agentData.avatar.type || "rom-unicorn",
            romUnicornType: (agentData.avatar.type === "rom-unicorn" ? "default" : finalAvatarData.romUnicornType),
            customType: agentData.avatar.customType || "upload",
            uploadedImage: agentData.avatar.uploadedImage,
            selectedNFT: agentData.avatar.selectedNFT,
            unicornParts: agentData.avatar.unicornParts,
          };
          console.log("✅ Loaded avatar from agentData:", {
            type: finalAvatarData.type,
            hasUnicornParts: !!finalAvatarData.unicornParts,
            hasUploadedImage: !!finalAvatarData.uploadedImage
          });
        }
        
        setAvatarData(finalAvatarData);
        
        // CRITICAL FIX: Restore theme from saved state or agentData
        if (savedState?.theme) {
          console.log("🎨 Restoring theme from database:", {
            savedTheme: savedState.theme,
            savedThemeType: typeof savedState.theme,
            currentTheme,
            willChangeTheme: savedState.theme !== currentTheme
          });
          setCurrentTheme(savedState.theme);
        } else if (agentData?.theme) {
          console.log("🎨 Loading theme from agentData:", {
            agentTheme: agentData.theme,
            agentThemeType: typeof agentData.theme,
            currentTheme,
            willChangeTheme: agentData.theme !== currentTheme
          });
          setCurrentTheme(agentData.theme);
        } else {
          console.log("🎨 No saved theme found, using default:", {
            currentTheme,
            defaultTheme: 'green'
          });
        }
        
        setHasLoadedFromDatabase(true);
        setLastSaved(new Date());
        
      } catch (error) {
        console.error("Failed to load saved progress:", error);
        setHasLoadedFromDatabase(true);
      }
    };
    
    loadSavedData();
  }, [documentId, agentData?.avatar])

  // Monitor agentData changes after initial load and update avatar if needed
  useEffect(() => {
    if (!hasLoadedFromDatabase || !agentData?.avatar) return;
    
    // Only update if agentData has newer avatar information
    const agentAvatar = agentData.avatar;
    if (agentAvatar && (
      agentAvatar.type !== avatarData.type ||
      JSON.stringify(agentAvatar.unicornParts) !== JSON.stringify(avatarData.unicornParts) ||
      agentAvatar.uploadedImage !== avatarData.uploadedImage
    )) {
      console.log('🔄 Updating avatar from agentData changes:', {
        oldType: avatarData.type,
        newType: agentAvatar.type,
        hasUnicornParts: !!agentAvatar.unicornParts,
        hasUploadedImage: !!agentAvatar.uploadedImage
      });
      
      setAvatarData(prev => ({
        ...prev,
        type: agentAvatar.type || prev.type,
        unicornParts: agentAvatar.unicornParts || prev.unicornParts,
        uploadedImage: agentAvatar.uploadedImage || prev.uploadedImage,
        selectedNFT: agentAvatar.selectedNFT || prev.selectedNFT,
        customType: agentAvatar.customType || prev.customType,
      }));
    }
  }, [agentData?.avatar, avatarData.type, avatarData.unicornParts, avatarData.uploadedImage, hasLoadedFromDatabase]);

  // ADDED: Monitor theme changes from agentData
  useEffect(() => {
    // CRITICAL FIX: Only sync FROM agentData TO currentTheme during initial load or if user hasn't made selections
    // Don't override user selections when orchestrator sends updates with default/missing theme
    
    // Skip sync if user has already made a theme selection (currentTheme !== 'green' default)
    if (currentTheme !== 'green' && agentData?.theme === 'green') {
      console.log('🚫 SKIPPING agentData theme sync - preserving user selection:', {
        userTheme: currentTheme,
        agentDataTheme: agentData.theme,
        reason: 'user_selection_priority'
      });
      return;
    }
    
    // Only sync if agentData has a non-default theme AND it's different from current
    if (agentData?.theme && agentData.theme !== 'green' && agentData.theme !== currentTheme) {
      console.log('🎨 Updating theme from agentData changes:', {
        oldTheme: currentTheme,
        newTheme: agentData.theme,
        source: 'agentData_update',
        reason: 'non_default_theme_from_external'
      });
      setCurrentTheme(agentData.theme);
    }
    // CRITICAL: Don't reset currentTheme if agentData.theme becomes undefined or default
    // This preserves user selections during orchestrator updates
  }, [agentData?.theme, currentTheme]);

  // REMOVED: Control Matrix Box visibility useEffect - let manual control handle it
  // This was causing conflicts with the regenerate function

  // ADDED: Initialize Matrix Box visibility on load
  useEffect(() => {
    const hasUnicornParts = !!(avatarData.unicornParts && Object.keys(avatarData.unicornParts).length > 0);
    if (!hasUnicornParts && !showMatrixBox) {
      console.log("🎲 Initializing Matrix Box visibility - no unicorn parts found");
      setShowMatrixBox(true);
    } else if (hasUnicornParts && showMatrixBox) {
      console.log("🎲 Hiding Matrix Box - unicorn parts found");
      setShowMatrixBox(false);
    }
  }, [hasLoadedFromDatabase]); // Only run after initial load

  const clearSavedData = async () => {
    // Clear database state instead of localStorage
    if (documentId && documentId !== 'init') {
      try {
        await saveAvatarCreatorState(documentId, {
          avatarData: {
            isAuthenticated: false,
            name: "",
            type: "rom-unicorn",
            romUnicornType: "default",
            customType: "upload",
            oauthConnections: [],
          },
          step: 1,
          name: "",
          theme: 'green', // Reset to default theme
        });
      } catch (error) {
        console.error("Failed to clear saved data:", error);
      }
    }
    
    setLastSaved(null)
    setHasUnsavedChanges(false)
    // Reset to initial state
    setAvatarData({
      isAuthenticated: false,
      name: "",
      type: "rom-unicorn",
      romUnicornType: "default",
      customType: "upload",
      oauthConnections: [],
    })
    // setStep(1)
    setGeneratedVariations([])
    setCreationProgress(0)
    setIsCreating(false)
  }

  const handleNameChange = (name: string) => {
    const updatedData = { ...avatarData, name };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleTypeChange = (type: AvatarType) => {
    const updatedData = { ...avatarData, type };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleRomUnicornTypeChange = (romUnicornType: RomUnicornType) => {
    const updatedData = { ...avatarData, romUnicornType };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleCustomTypeChange = (customType: CustomType) => {
    const updatedData = { ...avatarData, customType };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const updatedData = { ...avatarData, uploadedImage: e.target?.result as string };
        setAvatarData(updatedData);
        // FIXED: Save only to metadata, don't update main content for performance
        saveToDatabase(updatedData, step, false);
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStyleSelect = (styleId: string) => {
    const updatedData = { ...avatarData, selectedStyle: styleId };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleAccessTokenChange = (token: string) => {
    setAvatarData((prev) => ({ ...prev, accessToken: token }))
  }

  // Generate OAuth authorization URL with proper parameters
  const generateOAuthUrl = async (providerId: string): Promise<string | null> => {
    try {
      const provider = oauthProviders.find(p => p.id === providerId)
      if (!provider) {
        console.error(`OAuth provider not found: ${providerId}`)
        return null
      }

      // For Shopify, we need to prompt for shop domain
      let shopDomain: string | undefined
      if (providerId === 'shopify') {
        const shopDomainInput = prompt('Enter your Shopify store domain (e.g., your-store.myshopify.com):')
        if (!shopDomainInput) return null
        shopDomain = shopDomainInput
      }

      // Call server-side API to generate OAuth URL
      const response = await fetch('/api/oauth/generate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          shopDomain,
          documentId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to generate OAuth URL:', error)
        return null
      }

      const { authUrl, state } = await response.json()

      // Store state in session storage for verification
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`oauth_state_${providerId}`, state)
      }

      return authUrl
    } catch (error) {
      console.error('Error generating OAuth URL:', error)
      return null
    }
  }

  const handleOAuthLogin = async (providerId: string) => {
    console.log(`Initiating ${providerId} OAuth...`)
    
    const authUrl = await generateOAuthUrl(providerId)
    if (!authUrl) {
      console.error(`Failed to generate OAuth URL for ${providerId}`)
      return
    }

    // Store the current avatar ID in session storage for callback
    if (typeof window !== 'undefined' && documentId) {
      sessionStorage.setItem('oauth_avatar_document_id', documentId)
    }

    // Redirect to OAuth provider
    window.location.href = authUrl
  }

  // Handle OAuth callback data when returning from provider
  const handleOAuthCallback = (provider: string, connectionData: string) => {
    try {
      const connection = JSON.parse(decodeURIComponent(connectionData)) as OAuthConnection
      
      setAvatarData((prev) => {
        const existingConnections = prev.oauthConnections || []
        const filteredConnections = existingConnections.filter(conn => conn.provider !== provider)
        
        return {
          ...prev,
          isAuthenticated: true,
          oauthConnections: [...filteredConnections, connection],
          // Keep legacy fields for backward compatibility
          ...(provider === 'shopify' && {
            shopifyStore: connection.storeUrl,
            accessToken: connection.accessToken
          })
        }
      })

      // Show success message
      console.log(`Successfully connected ${provider} account: ${connection.username}`)
      
      // Clear OAuth-related session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`oauth_state_${provider}`)
        sessionStorage.removeItem('oauth_avatar_document_id')
      }
    } catch (error) {
      console.error(`Failed to parse OAuth callback data for ${provider}:`, error)
    }
  }

  // Check for OAuth callback on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const oauthSuccess = urlParams.get('oauth_success')
      const connectionData = urlParams.get('connection')
      const oauthError = urlParams.get('oauth_error')

      if (oauthSuccess && connectionData) {
        handleOAuthCallback(oauthSuccess, connectionData)
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      } else if (oauthError) {
        console.error('OAuth error:', decodeURIComponent(oauthError))
        // You could show an error toast here
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  const handleTokenSubmit = () => {
    if (avatarData.accessToken && avatarData.accessToken.length > 10) {
      setAvatarData((prev) => ({ ...prev, isAuthenticated: true }))
    }
  }

  const handleOAuthDisconnect = (providerId: string) => {
    setAvatarData((prev) => {
      const updatedConnections = (prev.oauthConnections || []).filter(conn => conn.provider !== providerId)
      
      return {
        ...prev,
        oauthConnections: updatedConnections,
        isAuthenticated: updatedConnections.length > 0,
        // Clear legacy fields if disconnecting Shopify
        ...(providerId === 'shopify' && {
          shopifyStore: undefined,
          accessToken: undefined
        })
      }
    })
  }

  const handleLogout = () => {
    setAvatarData((prev) => ({
      ...prev,
      isAuthenticated: false,
      accessToken: undefined,
      shopifyStore: undefined,
      oauthConnections: []
    }))
  }

  const getConnectedProvider = (providerId: string): OAuthConnection | undefined => {
    return avatarData.oauthConnections?.find(conn => conn.provider === providerId && conn.isActive)
  }

  const isProviderConnected = (providerId: string): boolean => {
    return !!getConnectedProvider(providerId)
  }

  const handlePersonalityChange = (personality: string) => {
    const updatedData = { ...avatarData, personality };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const handleCharacterNamesChange = (characterNames: string) => {
    const updatedData = { ...avatarData, characterNames };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleGenerateRandomUnicorn = () => {
    // FIXED: Clear unicorn parts and explicitly show Matrix Box for manual user interaction
    console.log("🔄 REGENERATE CLICKED - Clearing avatar to show Matrix Box...");
    console.log("Current state before clear:", {
      hasUnicornParts: !!avatarData.unicornParts,
      unicornParts: avatarData.unicornParts,
      showMatrixBox: showMatrixBox
    });
    setIsRegenerating(true);
    
    // Completely remove unicorn parts and explicitly show Matrix Box
    const clearedData = { ...avatarData };
    delete clearedData.unicornParts; // Remove unicornParts completely
    console.log("Setting cleared data:", clearedData);
    console.log("Setting showMatrixBox to TRUE");
    
    setAvatarData(clearedData);
    setShowMatrixBox(true); // Explicitly show Matrix Box
    saveToDatabase(clearedData, step, false);
    
    // Reset regenerating state after clearing
    setTimeout(() => {
      setIsRegenerating(false);
      console.log("✅ REGENERATE COMPLETE - Matrix Box should now be visible!");
      console.log("Final state:", {
        hasUnicornParts: !!clearedData.unicornParts,
        showMatrixBox: true
      });
    }, 100); // Brief delay to show feedback
    
    console.log("✅ Avatar cleared - Matrix Box ready for user interaction");
  }

  const connectWallet = async () => {
    console.log("Connecting to wallet...")
    const updatedData = { ...avatarData, connectedWallet: "0x1234...5678" };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const selectNFT = (nftId: string) => {
    const updatedData = { ...avatarData, selectedNFT: nftId };
    setAvatarData(updatedData);
    // FIXED: Save only to metadata, don't update main content for performance
    saveToDatabase(updatedData, step, false);
  }

  const [isSaving, setIsSaving] = useState(false)
  const isProcessingRef = useRef(false)

  const handleUnicornGenerated = useCallback(async (unicornParts: UnicornParts) => {
    // Prevent multiple saves for the same generation using ref
    if (isProcessingRef.current) {
      console.log("Already processing avatar generation, skipping duplicate")
      return
    }

    isProcessingRef.current = true
    setIsSaving(true)
    
    // Generate unique timestamp for this specific generation
    const timestamp = Date.now()
    console.log("Starting avatar generation with timestamp:", timestamp)
    
    // Update avatar data with generated parts
    const updatedAvatarData = {
      ...avatarData,
      unicornParts,
      type: "rom-unicorn" as AvatarType,
      romUnicornType: "random" as RomUnicornType,
      name: avatarData.name || `Unicorn ${timestamp}` // Use specific timestamp
    }
    
    setAvatarData(updatedAvatarData)
    setShowMatrixBox(false) // Hide Matrix Box when unicorn is generated
    console.log("🎲 Matrix Box hidden - unicorn generated successfully");
    
    // FIXED: Immediately save and propagate changes to main agent data
    try {
      await saveToDatabase(updatedAvatarData, step, true);
      console.log("✅ Generated unicorn saved and propagated to agent data");
      
      // RESTORED: Save to database for avatar selection functionality
      const avatarPayload: any = {
        name: updatedAvatarData.name,
        type: updatedAvatarData.type,
        romUnicornType: updatedAvatarData.romUnicornType,
        unicornParts: updatedAvatarData.unicornParts,
        isActive: false,
      };
      
      // Only include optional fields if they have values
      if (documentId) avatarPayload.documentId = documentId;
      if (updatedAvatarData.personality) avatarPayload.personality = updatedAvatarData.personality;
      if (updatedAvatarData.characterNames) avatarPayload.characterNames = updatedAvatarData.characterNames;
      if (updatedAvatarData.customType) avatarPayload.customType = updatedAvatarData.customType;
      if (updatedAvatarData.uploadedImage) avatarPayload.uploadedImage = updatedAvatarData.uploadedImage;
      if (updatedAvatarData.selectedStyle) avatarPayload.selectedStyle = updatedAvatarData.selectedStyle;
      if (updatedAvatarData.connectedWallet) avatarPayload.connectedWallet = updatedAvatarData.connectedWallet;
      if (updatedAvatarData.selectedNFT) avatarPayload.selectedNFT = updatedAvatarData.selectedNFT;
      
      console.log("Avatar payload being sent:", JSON.stringify(avatarPayload, null, 2));
      
      const newAvatar = await createAvatarInDB(avatarPayload)
      
      console.log("Avatar saved to database for selection:", newAvatar)
    } catch (error) {
      console.error("Failed to save avatar:", error)
      // Show error to user
      alert("Failed to save avatar. Please try again.")
    } finally {
      setIsSaving(false)
      isProcessingRef.current = false
    }
  }, [avatarData, createAvatarInDB, documentId, saveToDatabase, step])

  const handleSelectAvatar = async (avatar: Avatar) => {
    try {
      // Set this avatar as active for the current document
      await setActiveAvatar(avatar.id)
      
      // Load the selected avatar data into the current form for viewing
      const updatedAvatarData = {
        name: avatar.name,
        personality: avatar.personality,
        characterNames: avatar.characterNames,
        type: avatar.type as AvatarType,
        romUnicornType: avatar.romUnicornType as RomUnicornType,
        customType: avatar.customType as CustomType,
        uploadedImage: avatar.uploadedImage,
        selectedStyle: avatar.selectedStyle,
        connectedWallet: avatar.connectedWallet,
        selectedNFT: avatar.selectedNFT,
        unicornParts: avatar.unicornParts,
        oauthConnections: (avatar as any).oauthConnections || [],
        isAuthenticated: (avatar as any).oauthConnections?.length > 0 || avatarData.isAuthenticated,
        accessToken: avatarData.accessToken,
        shopifyStore: avatarData.shopifyStore,
      };
      
      setAvatarData(updatedAvatarData);
      
      // FIXED: Update main content when selecting from library so avatar is saved to agent
      await saveToDatabase(updatedAvatarData, step, true);
      
      // REMOVED: Don't force tab change during save operations - let user stay on current tab
      // setStep(1)
      
      console.log(`Avatar "${avatar.name}" is now active and saved to agent data`)
    } catch (error) {
      console.error('Failed to select avatar:', error)
    }
  }



  // Updated step titles
  const stepTitles = ["Avatar", "Personality", "Connection", "App"]

  const getSelectedStyle = () => {
    return artStyles.find((style) => style.id === avatarData.selectedStyle)
  }

  const renderAvatarPreview = (size = 128) => {
    if (avatarData.type === "rom-unicorn" && avatarData.unicornParts) {
      return <CompositeUnicorn parts={avatarData.unicornParts} size={size} />
    } else if (avatarData.type === "custom" && avatarData.customType === "upload" && avatarData.uploadedImage) {
      return (
        <Image
          src={avatarData.uploadedImage || "/placeholder.svg"}
          alt="Avatar preview"
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      )
    } else if (avatarData.type === "custom" && avatarData.customType === "wallet" && avatarData.selectedNFT) {
      return <span className="text-4xl">{avatarData.selectedNFT.split(" ")[0]}</span>
    } else {
      return <span className="text-4xl text-gray-400">🦄</span>
    }
  }

  // Theme selection handler with immediate save
  const handleThemeSelect = useCallback((theme: string) => {
    console.log('🎨 Theme selected:', theme);
    console.log('🎨 Theme selection debug:', {
      receivedTheme: theme,
      themeType: typeof theme,
      currentTheme,
      previousTheme: currentTheme
    });
    
    setCurrentTheme(theme);
    
    // CRITICAL FIX: Immediately sync theme to main content (where orchestrator reads from)
    if (onThemeChange) {
      console.log('🎨 IMMEDIATE SYNC: Calling onThemeChange with theme:', theme);
      onThemeChange(theme);
    }
    
    // CRITICAL FIX: Save with new theme immediately (don't wait for state update)
    if (documentId && documentId !== 'init') {
      // Create a custom save call with the new theme
      const saveWithNewTheme = async () => {
        try {
          await saveAvatarCreatorState(documentId, {
            avatarData,
            step,
            theme: theme, // Use the new theme directly, not currentTheme state
            name: avatarData.name,
          });
          console.log('✅ Avatar data and theme saved with new theme:', theme);
        } catch (error) {
          console.error('❌ Failed to save theme to database metadata:', error);
        }
      };
      
      saveWithNewTheme();
    }
  }, [onThemeChange, documentId, avatarData, step]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-3 sm:p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎨</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-green-400">Avatar Creator</h1>
                <p className="text-xs sm:text-sm text-gray-400">Design and configure your AI agent avatar</p>
              </div>
            </div>

            {/* Save Status & Actions */}
            
          </div>

          {/* Progress restoration notice */}
          {lastSaved && step > 1 && (
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/50 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                  <span className="text-blue-400 text-xs">↻</span>
                </div>
                <p className="text-xs text-blue-400">
                  Progress restored from {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </div>



        {/* Avatar Creator Section */}
        <div className="w-full">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex items-center">
                  <button
                    onClick={() => setStep(i)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-105 ${
                      i <= step ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {i <= step ? "✓" : i}
                  </button>
                  <button
                    onClick={() => setStep(i)}
                    className={`ml-2 sm:ml-3 text-xs sm:text-sm transition-colors duration-200 cursor-pointer hover:underline ${
                      i <= step ? "text-green-400" : "text-gray-500"
                    } hidden sm:inline`}
                  >
                    {stepTitles[i - 1]}
                  </button>
                </div>
                {i < 4 && (
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div className={`h-px transition-all duration-300 ${i < step ? "bg-green-500" : "bg-gray-800"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Mobile step titles */}
          <div className="mt-2 text-center sm:hidden">
            <span className="text-xs text-green-400">{stepTitles[step - 1]}</span>
          </div>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="border-b border-gray-800 bg-gray-900/30 p-4 sm:p-6">
                        <CardTitle className="text-green-400 text-base sm:text-lg font-medium flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 rounded flex items-center justify-center">
                <span className="text-green-400 text-xs sm:text-sm">
                  {step === 1 && "🎲"}
                  {step === 2 && "⚙️"}
                  {step === 3 && "🔐"}
                  {step === 4 && "🚀"}
                </span>
              </div>
              Create New Avatar - {stepTitles[step - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Step 1: Generate Avatar with Matrix Box */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-400 text-lg sm:text-xl">🎲</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-green-400 mb-2">Choose Your Avatar</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Select an existing avatar or create a new one
                  </p>
                </div>

                {/* Existing Avatars Section - Show if avatars exist and not creating new */}
                {avatars.length > 0 && !showCreateNew && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <h4 className="text-sm sm:text-base font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                          <span className="text-blue-400 text-xs">📚</span>
                        </div>
                        Select Existing Avatar
                      </h4>
                      <AvatarList 
                        onSelectAvatar={handleSelectAvatar}
                        documentId={documentId}
                      />
                    </div>
                    
                    {/* Create New Button */}
                    <div className="text-center">
                      <Button
                        onClick={() => {
                          setShowCreateNew(true)
                          // Reset to blank state for new avatar creation
                          setAvatarData({
                            isAuthenticated: avatarData.isAuthenticated,
                            accessToken: avatarData.accessToken,
                            shopifyStore: avatarData.shopifyStore,
                            name: "",
                            type: "rom-unicorn",
                            romUnicornType: "default",
                            customType: "upload",
                            oauthConnections: avatarData.oauthConnections || [],
                          })
                        }}
                        variant="outline"
                        className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all duration-150 h-10 sm:h-auto"
                      >
                        <span className="mr-2">✨</span>
                        Create New Avatar
                      </Button>
                    </div>
                  </div>
                )}

                {/* No Avatars - Show create new directly */}
                {avatars.length === 0 && !showCreateNew && (
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-2xl">🎨</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No Avatars Yet</h4>
                      <p className="text-sm text-gray-400 mb-4">Create your first avatar to get started!</p>
                      <Button
                        onClick={() => {
                          setShowCreateNew(true)
                          // Reset to blank state for new avatar creation
                          setAvatarData({
                            isAuthenticated: avatarData.isAuthenticated,
                            accessToken: avatarData.accessToken,
                            shopifyStore: avatarData.shopifyStore,
                            name: "",
                            type: "rom-unicorn",
                            romUnicornType: "default",
                            customType: "upload",
                            oauthConnections: avatarData.oauthConnections || [],
                          })
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 h-10 sm:h-auto"
                      >
                        <span className="mr-2">✨</span>
                        Create Your First Avatar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Create New Avatar Interface */}
                {showCreateNew && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Back to Selection Button */}
                    {avatars.length > 0 && (
                      <div className="flex justify-start">
                        <Button
                          onClick={() => {
                            setShowCreateNew(false)
                            setAvatarData(prev => ({ ...prev, unicornParts: undefined }))
                            setShowMatrixBox(true) // Show Matrix Box when going back to selection
                            console.log("🔄 Back to Selection - Matrix Box should show");
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-150 h-8"
                        >
                          <span className="mr-2">←</span>
                          Back to Selection
                        </Button>
                      </div>
                    )}

                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <h4 className="text-sm sm:text-base font-medium text-green-400 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center">
                          <span className="text-green-400 text-xs">🎲</span>
                        </div>
                        Generate New Avatar
                      </h4>

                      {/* Matrix Box - Show when explicitly requested or when no unicorn parts exist */}
                      {(() => {
                        const hasUnicornParts = !!(avatarData.unicornParts && Object.keys(avatarData.unicornParts).length > 0);
                        const shouldShow = showMatrixBox || !hasUnicornParts;
                        console.log('🎲 Matrix Box render check:', {
                          showMatrixBox,
                          hasUnicornParts,
                          unicornPartsValue: avatarData.unicornParts,
                          shouldShow,
                          step
                        });
                        return shouldShow;
                      })() && (
                        <div className="space-y-4">
                          <MatrixBox onUnicornGenerated={handleUnicornGenerated} />
                          
                          {/* Instructions */}
                          <div className="p-3 sm:p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
                            <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                              <span className="text-blue-400">💡</span>
                              How to Use
                            </h5>
                            <div className="text-xs sm:text-sm text-blue-300 space-y-1">
                              <p>• Hold down on the Matrix Box to charge it up</p>
                              <p>• Release when charged to generate a random unicorn</p>
                              <p>• Each generation creates a unique combination of parts</p>
                              <p>• Keep generating until you find one you like!</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generated Unicorn Preview with Regenerate Button */}
                      {avatarData.unicornParts && (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="p-8 bg-black rounded-lg border border-gray-700 transition-all duration-700 ease-out opacity-100">
                            <div className="flex justify-center">
                              <div className="transform transition-all duration-300 ease-out hover:scale-110 hover:rotate-1">
                                <CompositeUnicorn parts={avatarData.unicornParts} size={240} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                            <Button
                              onClick={handleGenerateRandomUnicorn}
                              disabled={isRegenerating}
                              variant="outline"
                              className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all duration-150 h-10 sm:h-auto disabled:opacity-50"
                            >
                              <span className="mr-2">{isRegenerating ? '⏳' : '🔄'}</span>
                              {isRegenerating ? 'Clearing...' : 'Regenerate'}
                            </Button>
                            
                            {/* Auto-saved indicator */}
                            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Avatar Saved Automatically</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

                {/* Step 2: Name Your Avatar */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-5">
                  {/* Avatar Name */}
                  <div>
                    <Label htmlFor="avatar-name" className="text-sm font-medium text-gray-300 mb-2 block">
                      Avatar Name *
                    </Label>
                    <Input
                      id="avatar-name"
                      placeholder="Enter avatar name..."
                      value={avatarData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be the display name for your avatar</p>
                  </div>

                  {/* Personality Description */}
                  <div>
                    <Label
                      htmlFor="personality"
                      className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"
                    >
                      Personality Description
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center cursor-help">
                              <span className="text-xs text-gray-300">?</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe the avatar's personality traits, behavior, or characteristics</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <textarea
                      id="personality"
                      placeholder="Describe the personality... (e.g., friendly, professional, quirky, mysterious)"
                      value={avatarData.personality || ""}
                      onChange={(e) => handlePersonalityChange(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 rounded-md px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Help define your avatar's character and behavior
                    </p>
                  </div>

                  {/* Character Inspiration */}
                  <div>
                    <Label
                      htmlFor="character-names"
                      className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"
                    >
                      Character Inspiration
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center cursor-help">
                              <span className="text-xs text-gray-300">?</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Names of characters, celebrities, or personas that inspire this avatar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="character-names"
                      placeholder="Character names or inspirations... (e.g., Hermione Granger, Tony Stark, Yoda)"
                      value={avatarData.characterNames || ""}
                      onChange={(e) => handleCharacterNamesChange(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Reference characters that inspire this avatar's look or personality
                    </p>
                  </div>
                </div>

                {/* Configuration Summary */}
                {(avatarData.name || avatarData.personality || avatarData.characterNames) && (
                  <div className="p-4 sm:p-5 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 className="text-sm sm:text-base font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      Configuration Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      {avatarData.name && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Name:</span>
                          <span className="text-green-400 font-medium">{avatarData.name}</span>
                        </div>
                      )}
                      {avatarData.personality && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Personality:</span>
                          <span className="text-gray-300 flex-1">{avatarData.personality}</span>
                        </div>
                      )}
                      {avatarData.characterNames && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Inspired by:</span>
                          <span className="text-blue-400">{avatarData.characterNames}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Personality Suggestions */}
                <div className="p-3 sm:p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
                  <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <span className="text-blue-400">💡</span>
                    Quick Personality Ideas
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Friendly & Approachable",
                      "Professional & Confident",
                      "Creative & Artistic",
                      "Tech-Savvy & Modern",
                      "Wise & Thoughtful",
                      "Energetic & Playful",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handlePersonalityChange(suggestion)}
                        className="text-xs p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150 text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-300/70 mt-2">
                    Click any suggestion to use it, or write your own description
                  </p>
                </div>
              </div>
            )}

                {/* Step 3: Connect Store */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-400 text-lg sm:text-xl">🔐</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-blue-400 mb-2">Connect Your Accounts</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Connect to your social media and business accounts to enhance your avatar's capabilities
                  </p>
                  <div className="mt-2 p-2 bg-blue-900/10 rounded border border-blue-800/30">
                    <p className="text-xs text-blue-300">💡 Your progress is automatically saved as you work</p>
                  </div>
                </div>

                {!avatarData.isAuthenticated ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* OAuth Login Options */}
                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <span className="text-blue-400 text-2xl sm:text-3xl">🔗</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-2">OAuth Connections</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          {relevantOAuthProviders.length > 0 
                            ? `Connect the required ${relevantOAuthProviders[0].name} account for your agent`
                            : "No external API connections required for this agent"
                          }
                        </p>
                        {relevantOAuthProviders.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {relevantOAuthProviders.map((provider) => (
                            <Button
                              key={provider.id}
                              onClick={() => handleOAuthLogin(provider.id)}
                              disabled={isProviderConnected(provider.id)}
                              className={`bg-gradient-to-r ${provider.color} hover:opacity-90 text-white transition-all duration-150 h-12 sm:h-auto relative overflow-hidden ${
                                isProviderConnected(provider.id) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{provider.icon}</span>
                                <div className="text-left">
                                  <div className="font-medium text-sm">
                                    {isProviderConnected(provider.id) ? '✓ Connected' : `Connect ${provider.name}`}
                                  </div>
                                  <div className="text-xs opacity-90">{provider.description}</div>
                                </div>
                              </div>
                            </Button>
                          ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-gray-400 text-sm">
                                                          This agent doesn't require external API connections.
                            {externalApisMetadata?.some(api => api.connectionType === 'api_key') && (
                              <div className="mt-2 text-xs">
                                Note: This agent uses API key authentication which will be configured during deployment.
                              </div>
                            )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs sm:text-sm">
                        <span className="bg-[#0a0a0a] px-3 text-gray-400">or</span>
                      </div>
                    </div>

                    {/* Manual Token Entry */}
                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-orange-400 text-lg sm:text-xl">🔑</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-2">Access Token</h4>
                        <p className="text-sm text-gray-400 mb-4">Enter your Shopify private app access token</p>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="access-token" className="text-sm font-medium text-gray-300 mb-2 block">
                            Private App Access Token
                          </Label>
                          <Input
                            id="access-token"
                            type="password"
                            placeholder="shpat_..."
                            value={avatarData.accessToken || ""}
                            onChange={(e) => handleAccessTokenChange(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Find this in your Shopify admin under Apps → Private apps
                          </p>
                        </div>

                        <Button
                          onClick={handleTokenSubmit}
                          disabled={!avatarData.accessToken || avatarData.accessToken.length < 10}
                          className="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-150 disabled:opacity-50 h-10 sm:h-auto w-full"
                        >
                          <span className="mr-2">✓</span>
                          Authenticate
                        </Button>
                      </div>
                    </div>

                    {/* Help Section with Modal */}
                    <div className="p-3 sm:p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-xs sm:text-sm">ℹ️</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm sm:text-base font-medium text-blue-400 mb-1">Need help?</h5>
                          <p className="text-xs sm:text-sm text-gray-400 mb-3">
                            To create a private app: Go to your Shopify admin → Settings → Apps and sales channels →
                            Develop apps → Create an app → Configure Admin API scopes → Install app
                          </p>

                          <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150 h-8 text-xs"
                              >
                                <span className="mr-1">📖</span>
                                Step-by-Step Guide
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Authenticated State */
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-green-900/20 rounded-lg border border-green-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg sm:text-xl">✓</span>
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-medium text-green-400">Accounts Connected</h4>
                            <p className="text-sm text-green-200">
                              {avatarData.oauthConnections?.length || 0} account(s) connected
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-150 h-8 sm:h-auto"
                        >
                          Disconnect All
                        </Button>
                      </div>
                      
                      {/* Connected Providers List */}
                      <div className="space-y-3">
                        {avatarData.oauthConnections?.map((connection) => {
                          const provider = oauthProviders.find(p => p.id === connection.provider)
                          if (!provider) return null
                          
                          return (
                            <div key={connection.provider} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-green-500/30">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 bg-gradient-to-r ${provider.color} rounded-lg flex items-center justify-center`}>
                                  <span className="text-white text-sm">{provider.icon}</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-green-300">{provider.name}</div>
                                  <div className="text-xs text-green-200 flex items-center gap-2">
                                    <span>@{connection.username}</span>
                                    {connection.storeUrl && <span>• {connection.storeUrl}</span>}
                                  </div>
                                  <div className="text-xs text-green-400 font-mono">
                                    Connected: {new Date(connection.connectedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleOAuthDisconnect(connection.provider)}
                                variant="outline"
                                size="sm"
                                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all duration-150 h-7 text-xs"
                              >
                                Disconnect
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Add More Connections */}
                      {avatarData.oauthConnections && avatarData.oauthConnections.length < relevantOAuthProviders.length && (
                        <div className="mt-4 p-3 bg-blue-900/10 rounded-lg border border-blue-500/30">
                          <h5 className="text-sm font-medium text-blue-400 mb-2">Add More Connections</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {relevantOAuthProviders
                              .filter(provider => !isProviderConnected(provider.id))
                              .map((provider) => (
                                <Button
                                  key={provider.id}
                                  onClick={() => handleOAuthLogin(provider.id)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all duration-150 h-8 text-xs justify-start"
                                >
                                  <span className="mr-2">{provider.icon}</span>
                                  Connect {provider.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-3">Ready to Continue</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Shopify connection established</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">API access verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Ready for avatar creation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Preview Demo */}
            {step === 4 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-400 text-lg sm:text-xl">🚀</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-purple-400 mb-2">Your AI App Demo</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    This is what your agent builds - a fully functional cart recovery system with real-time data, 
                    automated workflows, and intelligent AI assistance. Built from simple prompts like "help me recover abandoned shopping carts".
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Mobile App Demo */}
                  <div className="flex justify-center overflow-hidden">
                    <div className="w-full max-w-4xl overflow-hidden">
                      <MobileAppDemoWrapper 
                        agentData={({
                          id: 'avatar-demo',
                          name: avatarData.name || "My AI Agent",
                          description: avatarData.personality || "A helpful AI assistant",
                          domain: "E-commerce",
                          theme: currentTheme, // FIXED: Use current theme state to reflect latest selection
                          createdAt: new Date().toISOString(),
                          avatar: avatarData.unicornParts ? {
                            type: 'rom-unicorn',
                            unicornParts: avatarData.unicornParts
                          } : avatarData.uploadedImage ? {
                            type: 'custom',
                            customType: 'upload',
                            uploadedImage: avatarData.uploadedImage
                          } : null,
                          models: [
                            {
                              id: 'customer-model',
                              name: 'Customer',
                              emoji: '👤',
                              hasPublishedField: true,
                              idField: 'id',
                              displayFields: ['name', 'email'],
                              fields: [
                                { id: '1', name: 'id', type: 'String', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                                { id: '2', name: 'email', type: 'String', isId: false, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'Email', sort: true, order: 2 },
                                { id: '3', name: 'name', type: 'String', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Name', sort: true, order: 3 },
                                { id: '4', name: 'status', type: 'String', isId: false, unique: false, list: false, required: false, kind: 'enum', relationField: false, title: 'Status', sort: true, order: 4 }
                              ],
                              enums: [],
                              records: [
                                { id: '1', modelId: 'customer-model', data: { id: '1', email: 'john@example.com', name: 'John Doe', status: 'active' }, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
                                { id: '2', modelId: 'customer-model', data: { id: '2', email: 'jane@example.com', name: 'Jane Smith', status: 'pending' }, createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
                                { id: '3', modelId: 'customer-model', data: { id: '3', email: 'bob@example.com', name: 'Bob Wilson', status: 'active' }, createdAt: '2024-01-17T10:00:00Z', updatedAt: '2024-01-17T10:00:00Z' }
                              ]
                            },
                            {
                              id: 'cart-model',
                              name: 'Shopping Cart',
                              emoji: '🛒',
                              hasPublishedField: false,
                              idField: 'id',
                              displayFields: ['customer_email', 'total'],
                              fields: [
                                { id: '1', name: 'id', type: 'String', isId: true, unique: true, list: false, required: true, kind: 'scalar', relationField: false, title: 'ID', sort: true, order: 1 },
                                { id: '2', name: 'customer_email', type: 'String', isId: false, unique: false, list: false, required: true, kind: 'scalar', relationField: false, title: 'Customer', sort: true, order: 2 },
                                { id: '3', name: 'total', type: 'Float', isId: false, unique: false, list: false, required: false, kind: 'scalar', relationField: false, title: 'Total', sort: true, order: 3 },
                                { id: '4', name: 'abandoned_at', type: 'DateTime', isId: false, unique: false, list: false, required: false, kind: 'scalar', relationField: false, title: 'Abandoned At', sort: true, order: 4 }
                              ],
                              enums: [],
                              records: [
                                { id: '1', modelId: 'cart-model', data: { id: '1', customer_email: 'john@example.com', total: 299.99, abandoned_at: '2024-01-18T10:00:00Z' }, createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
                                { id: '2', modelId: 'cart-model', data: { id: '2', customer_email: 'jane@example.com', total: 149.50, abandoned_at: '2024-01-19T10:00:00Z' }, createdAt: '2024-01-19T10:00:00Z', updatedAt: '2024-01-19T10:00:00Z' }
                              ]
                            }
                          ],
                          actions: [
                            {
                              id: 'send-email-action',
                              name: 'Send Recovery Email',
                              description: 'Send automated cart recovery email to customers',
                              results: { actionType: 'Create', model: 'Email' }
                            },
                            {
                              id: 'update-customer-action',
                              name: 'Update Customer Status',
                              description: 'Automatically update customer engagement status',
                              results: { actionType: 'Update', model: 'Customer' }
                            },
                            {
                              id: 'slack-notification-action',
                              name: 'Slack Notification',
                              description: 'Send alerts to team when high-value carts are abandoned',
                              results: { actionType: 'Create', model: 'Notification' }
                            }
                          ],
                          schedules: [
                            {
                              id: 'daily-email-schedule',
                              name: 'Daily Email Campaign',
                              description: 'Send cart recovery emails every day at 10 AM',
                              interval: { pattern: '0 10 * * *', active: true },
                              nextRun: '2024-01-21T10:00:00Z',
                              lastRun: '2024-01-20T10:00:00Z',
                              status: 'Active'
                            },
                            {
                              id: 'weekly-report-schedule',
                              name: 'Weekly Analytics Report',
                              description: 'Generate and send weekly performance reports',
                              interval: { pattern: '0 9 * * 1', active: true },
                              nextRun: '2024-01-22T09:00:00Z',
                              lastRun: '2024-01-15T09:00:00Z',
                              status: 'Active'
                            },
                            {
                              id: 'hourly-check-schedule',
                              name: 'Abandoned Cart Check',
                              description: 'Check for new abandoned carts every hour',
                              interval: { pattern: '0 * * * *', active: false },
                              nextRun: null,
                              lastRun: '2024-01-20T11:00:00Z',
                              status: 'Paused'
                            }
                          ]
                        } as any)}
                        onThemeChange={(theme) => {
                          // FIXED: Use the new handler that includes immediate saving
                          console.log("🎨 Avatar Creator - Theme changed to:", theme);
                          console.log("🎨 Previous theme:", currentTheme);
                          console.log("🎨 Theme change flow debug:", {
                            receivedFromMobileDemo: theme,
                            receivedType: typeof theme,
                            currentAvatarCreatorTheme: currentTheme,
                            isNewTheme: theme !== currentTheme,
                            agentDataTheme: agentData?.theme
                          });
                          
                          // Use the comprehensive theme handler
                          handleThemeSelect(theme);
                        }}
                        onDataChange={(updatedAgentData) => {
                          // FIXED: Handle other data changes if needed
                          console.log("Agent data changed:", updatedAgentData);
                          // For now, we only handle avatar and theme changes separately
                          // Other data changes can be handled here if needed in the future
                        }}
                      />
                    </div>
                  </div>

                  {/* Demo Description */}
                  <div className="text-center space-y-4 pt-4">
                    <p className="text-xs text-gray-400">
                      ✨ This demo shows what's possible when you describe your business needs to our AI
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">📊 Real-time Dashboard</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">🤖 AI Assistant</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">⏰ Smart Scheduling</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">📧 Email Automation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 sm:pt-6 border-t border-gray-800">
              <Button
                onClick={prevStep}
                disabled={step === 1}
                variant="outline"
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-all duration-150 h-10 sm:h-auto"
              >
                Previous
              </Button>
           
              {step < 4 && (
                <Button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !avatarData.unicornParts) ||
                    (step === 2 && !avatarData.name) ||
                    (step === 3 && !(avatarData.isAuthenticated && avatarData.oauthConnections && avatarData.oauthConnections.length > 0))
                  }
                  className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 disabled:opacity-50 h-10 sm:h-auto"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
} 