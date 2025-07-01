import type { AgentModel } from './model';
import type { AgentAction } from './action';
import type { AgentSchedule } from './schedule';

export interface AgentData {
  id?: string; // Optional for new agents, required for existing ones
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  createdAt: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: string;
    lastModifiedBy: string;
    tags: string[];
    status: string;
    [key: string]: any; // Allow additional metadata fields from orchestrator
  };
}

export interface AgentArtifactMetadata {
  selectedTab: 'onboard' | 'models' | 'actions' | 'schedules';
  editingModel: string | null;
  editingAction: string | null;
  editingSchedule: string | null;
  viewingModelData: string | null; // For viewing/editing model records
  editingRecord: string | null; // For editing specific record
  showExplanationModal?: 'models' | 'actions' | 'schedules' | null; // For explanation modals
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
} 