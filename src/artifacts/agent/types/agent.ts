import type { AgentModel } from './model';
import type { AgentAction } from './action';
import type { LegacyAgentSchedule } from './schedule';

export interface AgentData {
  id?: string; // Optional for new agents, required for existing ones
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  enums?: any[]; // Generated database enums for deployment
  actions: AgentAction[];
  schedules: LegacyAgentSchedule[];
  prismaSchema?: string; // Generated database schema for deployment
  createdAt: string;
  theme?: string; // Stored theme selection for the agent
  avatar?: {
    type: 'rom-unicorn' | 'custom';
    unicornParts?: {
      body: string;
      hair: string;
      eyes: string;
      mouth: string;
      accessory: string;
    };
    customType?: 'upload' | 'wallet';
    uploadedImage?: string;
    selectedNFT?: string;
  };
  externalApis?: Array<{
    provider: string;
    requiresConnection: boolean;
    connectionType: 'oauth' | 'api_key' | 'none';
    primaryUseCase: string;
    requiredScopes: string[];
    priority: 'primary' | 'secondary';
  }>;
  deployment?: {
    deploymentId: string;
    projectId: string;
    deploymentUrl: string;
    status: 'pending' | 'building' | 'ready' | 'error';
    apiEndpoints: string[];
    vercelProjectId: string;
    deployedAt: string;
    warnings: string[];
    deploymentNotes: string[];
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: string;
    lastModifiedBy: string;
    tags: string[];
    status: string;
    [key: string]: any; // Allow additional metadata fields from orchestrator
  };
  oauthTokens?: Record<string, {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    scope?: string;
  }>;
  apiKeys?: Record<string, {
    key: string;
    name: string;
    createdAt: string;
    lastUsed?: string;
  }>;
  credentials?: Record<string, {
    type: 'oauth' | 'api_key' | 'custom';
    data: any;
    isActive: boolean;
  }>;
  authConfig?: {
    providers: string[];
    defaultProvider?: string;
    settings: Record<string, any>;
  };
  integrations?: Array<{
    id: string;
    provider: string;
    status: 'connected' | 'disconnected' | 'error';
    connectionDate: string;
    lastSync?: string;
  }>;
  settings?: Record<string, any>;
}

export interface AgentArtifactMetadata {
  selectedTab: 'onboard' | 'models' | 'actions' | 'schedules' | 'chat';
  editingModel: string | null;
  editingAction: string | null;
  editingSchedule: string | null;
  viewingModelData: string | null; // For viewing/editing model records
  editingRecord: string | null; // For editing specific record
  currentStep?: string;
  stepProgress?: {
    'prompt-understanding'?: 'processing' | 'complete';
    'granular-analysis'?: 'processing' | 'complete';
    analysis?: 'processing' | 'complete';
    'change-analysis'?: 'processing' | 'complete';
    overview?: 'processing' | 'complete';
    models?: 'processing' | 'complete';
    examples?: 'processing' | 'complete';
    actions?: 'processing' | 'complete';
    schedules?: 'processing' | 'complete';
    complete?: 'processing' | 'complete';
  };
  stepMessages?: Record<string, string>;
  dataManagement?: {
    viewingModelId?: string;
    editingRecordId?: string | null;
    isAddingRecord?: boolean;
  } | null;
  showExplanationModal?: 'models' | 'actions' | 'schedules' | null;
} 