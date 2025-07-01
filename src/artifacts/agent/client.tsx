

import * as React from 'react';
import { Artifact } from '@/components/create-artifact';

import {
  CopyIcon,
  CodeIcon,
  PlayIcon,
  ClockRewind,
  UndoIcon,
  RedoIcon,
} from '@/components/icons';
import { toast } from 'sonner';

import { AgentBuilderContent } from './components/AgentBuilderContent';


interface AgentModel {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the model
  description?: string; // AI-generated description for preview
  hasPublishedField?: boolean; // Whether this model has a published field
  idField: string;
  displayFields: string[];
  fields: AgentField[];
  enums: AgentEnum[];
  forms?: AgentForm[]; // Forms for grouping fields during create/update
  records?: ModelRecord[]; // Store actual data records
  exampleRecords?: ModelRecord[]; // Store example data records
}

interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AgentField {
  id: string;
  name: string;
  type: string;
  isId: boolean;
  unique: boolean;
  list: boolean;
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean;
  title: string;
  sort: boolean;
  order: number;
  defaultValue?: string;
}

interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}

interface AgentAction {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the action
  description: string;
  role: 'admin' | 'member';
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: DatabaseModel[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: EnvVar[];
    };
    prompt?: {
      template: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
  uiComponents?: {
    stepForms: Array<{
      stepNumber: number;
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
      validationLogic: string;
      dataRequirements: Array<{
        modelName: string;
        fields: string[];
        purpose: string;
      }>;
    }>;
    resultView: {
      title: string;
      description: string;
      reactCode: string;
      propsInterface: Record<string, any>;
    };
  };
}

interface DatabaseModel {
  id: string;
  name: string;
  fields: DatabaseField[];
  where?: Record<string, any>;
  limit?: number;
}

interface DatabaseField {
  id: string;
  name: string;
}

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}

interface AgentData {
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

interface AgentArtifactMetadata {
  selectedTab: 'onboard' | 'models' | 'actions' | 'schedules';
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

// Interface for recurring scheduled tasks
interface AgentSchedule {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the schedule
  description: string;
  type: 'Create' | 'Update';
  role: 'admin' | 'member';
  interval: {
    pattern: string;
    timezone?: string;
    active?: boolean;
  };
  dataSource: {
    type: 'custom' | 'database';
    customFunction?: {
      code: string;
      envVars?: EnvVar[];
    };
    database?: {
      models: DatabaseModel[];
    };
  };
  execute: {
    type: 'code' | 'prompt';
    code?: {
      script: string;
      envVars?: EnvVar[];
    };
    prompt?: {
      template: string; 
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  results: {
    actionType: 'Create' | 'Update';
    model: string;
    identifierIds?: string[];
    fields?: Record<string, any>;
    fieldsToUpdate?: Record<string, any>;
  };
}

interface AgentForm {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: AgentFormField[];
  order: number;
}

interface AgentFormField {
  id: string;
  fieldId: string; // Reference to AgentField.id
  required?: boolean; // Override field's required setting for this form
  hidden?: boolean; // Hide field in this form
  order: number;
}

const FIELD_TYPES = [
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes'
];

const FIELD_KINDS = [
  { value: 'scalar', label: 'Scalar' },
  { value: 'object', label: 'Object' },
  { value: 'enum', label: 'Enum' }
];

// Helper function to generate new IDs
// Helper function to determine step status consistently across all progress indicators
const getStepStatus = (stepId: string, currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  // If there's explicit progress for this step, use it
  if (stepProgress?.[stepId as keyof typeof stepProgress]) {
    return stepProgress[stepId as keyof typeof stepProgress];
  }
  
  // Check if we have data for this step
  if (agentData) {
    switch (stepId) {
      case 'schedules':
        return agentData.schedules && agentData.schedules.length > 0 ? 'complete' : 'pending';
      case 'models':
        return agentData.models && agentData.models.length > 0 ? 'complete' : 'pending';
      case 'examples': {
        // Check if any model has example records
        const hasExamples = agentData.models?.some((model: AgentModel) => 
          model.exampleRecords && model.exampleRecords.length > 0
        );
        return hasExamples ? 'complete' : 'pending';
      }
      case 'actions':
        return agentData.actions && agentData.actions.length > 0 ? 'complete' : 'pending';
      case 'overview':
        return agentData.name && agentData.description && agentData.domain ? 'complete' : 'pending';
      case 'complete':
        return 'pending'; // This should be set explicitly
      default:
        return 'pending';
    }
  }
  
  // If this is the current step, it's processing
  if (currentStep === stepId) {
    return 'processing';
  }
  
  return 'pending';
};


export const agentArtifact = new Artifact<'agent', AgentArtifactMetadata>({
  kind: 'agent',
  description: 'AI Agent Builder for creating database-driven automation systems',
  
  initialize: ({ setMetadata }) => {
    setMetadata({
      selectedTab: 'onboard',
      editingModel: null,
      editingAction: null,
      editingSchedule: null,
      viewingModelData: null,
      editingRecord: null,
      dataManagement: null,
      showExplanationModal: null
    });
  },
  
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'agent-data') {
      const agentData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: JSON.stringify(agentData, null, 2),
          isVisible: true,
          status: 'streaming',
        };
      });
    }
    
    if (streamPart.type === 'agent-step') {
      const stepData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      // Map orchestrator step IDs to UI step IDs for consistency
      const stepIdMapping: Record<string, string> = {
        'step0': 'prompt-understanding',
        'step1': 'analysis', 
        'step2': 'overview',
        'step3': 'models',
        'step4': 'actions',
        'step5': 'schedules',
        'complete': 'complete'
      };
      
      const mappedStepId = stepIdMapping[stepData.step] || stepData.step;
        
      setMetadata((draftMetadata) => {
        const newMetadata: AgentArtifactMetadata = {
          ...(draftMetadata || {}),
          selectedTab: draftMetadata?.selectedTab || 'models',
          editingModel: draftMetadata?.editingModel || null,
          editingAction: draftMetadata?.editingAction || null,
          editingSchedule: draftMetadata?.editingSchedule || null,
          currentStep: mappedStepId,
          stepProgress: {
            ...(draftMetadata?.stepProgress || {}),
            [mappedStepId]: stepData.status,
            // Also store the original step ID for compatibility
            [stepData.step]: stepData.status
          },
          stepMessages: {
            ...(draftMetadata?.stepMessages || {}),
            [mappedStepId]: stepData.message || '',
            // Also store the original step ID for compatibility
            [stepData.step]: stepData.message || ''
          }
        };
        return newMetadata;
      });
      
      if (stepData.status === 'processing') {
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        }));
      }
      
      // Handle any step completion to ensure visibility (but not for the final complete step)
      if (stepData.status === 'complete' && stepData.step !== 'complete' && mappedStepId !== 'complete') {
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        }));
      }
      
      // Handle final completion - let orchestrator control the final status
      // Don't set timeout here as it causes race conditions with document saves
      if (stepData.status === 'complete' && (stepData.step === 'complete' || mappedStepId === 'complete')) {
        // Just ensure visibility, let the orchestrator handle status changes
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          // Keep status as 'streaming' - will be changed by orchestrator when save completes
        }));
      }
    }

    // Handle text-delta streams during generation
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        const newContent = draftArtifact.content + (streamPart.content as string);
        
        return {
          ...draftArtifact,
          content: newContent,
          isVisible: draftArtifact.status === 'streaming' && newContent.length > 200,
          // Don't change status here - let the completion timeout handle it
        };
      });
    }

    // Handle artifact ready signal from orchestrator after save completes
    if (streamPart.type === 'artifact-ready') {
      const readyData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      if (readyData.status === 'idle') {
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          status: 'idle',
        }));
      }
    }
  },

  content: AgentBuilderContent,

  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy agent configuration',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Agent configuration copied to clipboard!');
      },
    },
  ],

  toolbar: [
    {
      icon: <CodeIcon />,
      description: 'Generate code from agent',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Generate the implementation code for this agent system including database schema, API endpoints, and business logic.',
        });
      },
    },
    {
      icon: <PlayIcon />,
      description: 'Deploy agent',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Help me deploy this agent system. What are the next steps and requirements?',
        });
      },
    },
  ],
}); 
