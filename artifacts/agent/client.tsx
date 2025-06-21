import React, { useState, useCallback, useEffect, memo } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { DiffView } from '@/components/diffview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  CopyIcon,
  PlusIcon,
  CrossIcon,
  CodeIcon,
  PlayIcon,
  PencilEditIcon,
  ClockRewind,
  UndoIcon,
  RedoIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';

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
  type: 'Create' | 'Update';
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
  name: string;
  description: string;
  domain: string;
  models: AgentModel[];
  actions: AgentAction[];
  schedules: AgentSchedule[];
  createdAt: string;
}

interface AgentArtifactMetadata {
  selectedTab: 'models' | 'actions' | 'schedules';
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
    integration?: 'processing' | 'complete';
  };
  stepMessages?: Record<string, string>;
  dataManagement?: {
    viewingModelId?: string;
    editingRecordId?: string | null;
    isAddingRecord?: boolean;
  } | null;
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
function generateNewId(type: string, existingEntities: any[]): string {
  const prefixMap: Record<string, string> = {
    'model': 'mdl',
    'field': 'fld',
    'enum': 'enm',
    'enumField': 'enf',
    'action': 'act',
    'form': 'frm',
    'formField': 'ff'
  };
  
  const prefix = prefixMap[type] || type.charAt(0);
  
  const highestId = existingEntities.reduce((max, entity) => {
    if (entity.id?.startsWith(prefix)) {
      const idNumber = Number.parseInt(entity.id.slice(prefix.length), 10);
      return Number.isNaN(idNumber) ? max : Math.max(max, idNumber);
    }
    return max;
  }, 0);
  
  return `${prefix}${highestId + 1}`;
}

// Helper function to determine step status consistently across all progress indicators
const getStepStatus = (stepId: string, currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  // If we have explicit step progress for this step, use it
  if (stepProgress?.[stepId as keyof typeof stepProgress]) {
    return stepProgress[stepId as keyof typeof stepProgress];
  }

  // If this is the current step, it's processing
  if (currentStep === stepId) {
    return 'processing';
  }

  // For schedules, check if they exist
  if (stepId === 'schedules') {
    return agentData?.schedules && agentData.schedules.length > 0 ? 'complete' : 'pending';
  }
  
  // For models, check if they exist 
  if (stepId === 'models') {
    return agentData?.models && agentData.models.length > 0 ? 'complete' : 'pending';
  }
  
  // For examples, check if they exist (only for new models)
  if (stepId === 'examples') {
    return agentData?.models && agentData.models.some((model: any) => model.records && model.records.length > 0) ? 'complete' : 'pending';
  }
  
  // For actions, check if they exist
  if (stepId === 'actions') {
    return agentData?.actions && agentData.actions.length > 0 ? 'complete' : 'pending';
  }
  
  // For overview, check if basic info exists
  if (stepId === 'overview') {
    return agentData?.name && agentData?.description && agentData?.domain ? 'complete' : 'pending';
  }
  
  // For integration, check if all components are complete
  if (stepId === 'integration') {
    const hasBasicInfo = agentData?.name && agentData?.description && agentData?.domain;
    const hasModels = agentData?.models && agentData.models.length > 0;
    const hasActions = agentData?.actions && agentData.actions.length > 0;
    return hasBasicInfo && hasModels && hasActions ? 'complete' : 'pending';
  }
  
  // For early analysis steps, we rely on stepProgress or currentStep
  return 'pending';
};

// Helper function to calculate progress percentage consistently
const calculateProgressPercentage = (currentStep?: string, stepProgress?: Record<string, 'processing' | 'complete'>, agentData?: any) => {
  const steps = [
    { id: 'prompt-understanding', name: 'Understanding Requirements' },
    { id: 'granular-analysis', name: 'Granular Analysis' },
    { id: 'analysis', name: 'Analysis' },
    { id: 'change-analysis', name: 'Change Analysis' },
    { id: 'overview', name: 'Overview' },
    { id: 'models', name: 'Data Models' },
    { id: 'examples', name: 'Example Records' },
    { id: 'actions', name: 'Automated Actions' },
    { id: 'schedules', name: 'Schedules' },
    { id: 'integration', name: 'Integration' }
  ];
  
  const completedSteps = steps.filter(step => getStepStatus(step.id, currentStep, stepProgress, agentData) === 'complete').length;
  
  return (completedSteps / steps.length) * 100;
};

// Progress Indicator Component
const StepProgressIndicator = ({ currentStep = '', agentData, stepMessages = {}, stepProgress }: { 
  currentStep?: string, 
  agentData: any,
  stepMessages?: Record<string, string>,
  stepProgress?: {
    'prompt-understanding'?: 'processing' | 'complete';
    'granular-analysis'?: 'processing' | 'complete';
    analysis?: 'processing' | 'complete';
    'change-analysis'?: 'processing' | 'complete';
    overview?: 'processing' | 'complete';
    models?: 'processing' | 'complete';
    actions?: 'processing' | 'complete';
    schedules?: 'processing' | 'complete';
    integration?: 'processing' | 'complete';
  }
}) => {
  const steps = [
    { 
      id: 'prompt-understanding', 
      title: 'Understanding Requirements',
      description: 'Analyzing your request in detail',
      icon: '🧠'
    },
    { 
      id: 'granular-analysis', 
      title: 'Detailed Planning',
      description: 'Creating execution strategy',
      icon: '🔍'
    },
    { 
      id: 'analysis', 
      title: 'AI Decision Making',
      description: 'Determining optimal approach',
      icon: '🤖'
    },
    { 
      id: 'change-analysis', 
      title: 'Change Impact Analysis',
      description: 'Analyzing modifications needed',
      icon: '📋'
    },
    { 
      id: 'overview', 
      title: 'System Architecture',
      description: 'Designing system overview',
      icon: '🏗️'
    },
    { 
      id: 'models', 
      title: 'Data Models',
      description: 'Defining data structures',
      icon: '📊'
    },
    { 
      id: 'examples', 
      title: 'Example Records',
      description: 'Generating sample data',
      icon: '📝'
    },
    { 
      id: 'actions', 
      title: 'Automated Actions',
      description: 'Creating workflow automations',
      icon: '⚡'
    },
    {
      id: 'schedules',
      title: 'Schedules & Timing',
      description: 'Automated execution timing',
      icon: '⏰'
    },
    {
      id: 'integration',
      title: 'System Integration',
      description: 'Finalizing and integrating',
      icon: '🔧'
    }
  ];

  const completedSteps = steps.filter(step => getStepStatus(step.id, currentStep, stepProgress, agentData) === 'complete').length;
  const progressPercentage = calculateProgressPercentage(currentStep, stepProgress, agentData);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Building Your AI Agent</h3>
          <p className="text-sm text-gray-600 mt-1">
            {completedSteps === steps.length 
              ? '🎉 Agent successfully built!' 
              : (() => {
                  // Find the current active step or the next pending step
                  const activeStep = steps.find(s => getStepStatus(s.id, currentStep, stepProgress, agentData) === 'processing');
                  const nextPendingStep = steps.find(s => getStepStatus(s.id, currentStep, stepProgress, agentData) === 'pending');
                  const currentStepLabel = activeStep?.title || nextPendingStep?.title || 'Processing';
                  
                  return `Step ${completedSteps + 1} of ${steps.length} - ${currentStepLabel}`;
                })()
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{Math.round(calculateProgressPercentage(currentStep, stepProgress, agentData))}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, currentStep, stepProgress, agentData);
          const message = stepMessages[step.id];
          
          return (
            <div 
              key={step.id} 
              className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 ${
                status === 'complete' 
                  ? 'bg-green-50 border border-green-200' 
                  : status === 'processing' 
                    ? 'bg-blue-50 border border-blue-200 shadow-md' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Step Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                status === 'complete'
                  ? 'bg-green-500 text-white'
                  : status === 'processing'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {status === 'complete' ? '✓' : status === 'processing' ? step.icon : index + 1}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${
                    status === 'complete' ? 'text-green-900' : 
                    status === 'processing' ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {step.title}
                  </h4>
                </div>

                {/* Step Description/Message */}
                <p className={`text-sm ${
                  status === 'complete' ? 'text-green-700' : 
                  status === 'processing' ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {message || step.description}
                </p>

                {/* Processing Animation */}
                {status === 'processing' && (
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Working...</span>
                  </div>
                )}

                {/* Completion Details */}
                {status === 'complete' && agentData && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.id === 'overview' && agentData.domain && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.domain}
                      </span>
                    )}
                    {step.id === 'models' && agentData.models && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.models.length} models created
                      </span>
                    )}
                    {step.id === 'examples' && agentData.models && agentData.models.some((model: any) => model.records && model.records.length > 0) && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.models.reduce((sum: number, model: any) => sum + (model.records?.length || 0), 0)} example records generated
                      </span>
                    )}
                    {step.id === 'actions' && agentData.actions && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.actions.length} actions automated
                      </span>
                    )}
                    {step.id === 'schedules' && agentData.schedules && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.schedules.length} schedules configured
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Summary */}
      {completedSteps === steps.length && agentData && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🎉</span>
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Agent Successfully Built!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your <strong>{agentData.name}</strong> is ready with {agentData.models?.length || 0} models and {agentData.actions?.length || 0} automated actions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Model Editor Component
const ModelEditor = memo(({ 
  model, 
  onUpdate, 
  onDelete,
  allModels,
  allEnums,
  updateModel,
  allActions
}: { 
  model: AgentModel;
  onUpdate: (model: AgentModel) => void;
  onDelete: () => void;
  allModels: AgentModel[];
  allEnums: AgentEnum[];
  updateModel: (model: AgentModel) => void;
  allActions: AgentAction[];
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = useCallback(() => {
    const newField: AgentField = {
      id: generateNewId('field', model.fields),
      name: `field${model.fields.length + 1}`,
      type: 'String',
      isId: false,
      unique: false,
      list: false,
      required: false,
      kind: 'scalar',
      relationField: false,
      title: '',
      sort: false,
      order: 0, // Reset order since we're adding to top
      defaultValue: ''
    };
    
    // Add to top of list and set to editing mode
    onUpdate({
      ...model,
      fields: [newField, ...model.fields]
    });
    setEditingField(newField.id);
  }, [model, onUpdate]);

  const updateField = useCallback((fieldId: string, updates: Partial<AgentField>) => {
    onUpdate({
      ...model,
      fields: model.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  }, [model, onUpdate]);

  const deleteField = useCallback((fieldId: string) => {
    const field = model.fields.find(f => f.id === fieldId);
    const fieldName = field?.name || 'this field';
    
    if (window.confirm(`Are you sure you want to delete field "${fieldName}"? This action cannot be undone.`)) {
    onUpdate({
      ...model,
      fields: model.fields.filter(field => field.id !== fieldId)
    });
    }
  }, [model, onUpdate]);

  return (
    <div className="space-y-6">
      {/* Model Basic Info */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <span className="text-green-400 text-xl">🗃️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-200 font-mono">Model Configuration</h3>
              <p className="text-green-400 text-sm font-mono">Define your database entity structure</p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <CrossIcon size={16} />
              <span>Remove Model</span>
            </div>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor={`model-name-${model.id}`} className="text-green-300 font-mono font-medium">Model Name</Label>
            <Input
              id={`model-name-${model.id}`}
              value={model.name}
              onChange={(e) => onUpdate({ ...model, name: e.target.value })}
              placeholder="Model name (e.g., User, Post, Order)"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`model-id-field-${model.id}`} className="text-green-300 font-mono font-medium">
              ID Field
              <span className="text-xs text-gray-400 ml-2">(Protected)</span>
            </Label>
            <div className="relative">
              <Input
                id={`model-id-field-${model.id}`}
                value={model.idField}
                readOnly
                disabled
                placeholder="ID field name (e.g., id)"
                className="bg-gray-800/50 border-gray-500/30 text-gray-400 placeholder-gray-500/50 cursor-not-allowed font-mono"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-mono">
                  🔒
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Primary key is always "id" for consistency
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Visibility</Label>
            <label className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={model.hasPublishedField || false}
                onChange={(e) => onUpdate({ ...model, hasPublishedField: e.target.checked })}
                className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
              />
              <span className="text-green-200 text-sm font-mono font-medium">Published</span>
            </label>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <Label className="text-green-300 font-mono font-medium">Description</Label>
          <Input
            value={model.description || ''}
            onChange={(e) => onUpdate({ ...model, description: e.target.value })}
            placeholder="Model description (optional)"
            className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
          />
          {model.description && (
            <p className="text-green-400 text-sm font-mono italic">
              {model.description}
            </p>
          )}
        </div>
      </div>

      {/* Fields Section */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
            <h4 className="text-lg font-semibold text-green-200 font-mono">Field Definitions</h4>
            <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
              <span className="text-green-300 text-xs font-medium font-mono">{model.fields.length} fields</span>
            </div>
          </div>
          <Button 
            onClick={addField}
            className="btn-matrix px-4 py-2 text-sm font-mono"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} />
              <span>Add Field</span>
            </div>
          </Button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {model.fields.map((field) => (
            <div key={field.id} className="p-4 rounded-xl bg-black/30 border border-green-500/20 hover:border-green-500/40 transition-colors">
              {editingField === field.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="Field name"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value })}
                      >
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-green-500/30">
                          {field.kind === 'scalar' && FIELD_TYPES.map(type => (
                            <SelectItem key={type} value={type} className="text-green-200 focus:bg-green-500/20 font-mono">{type}</SelectItem>
                          ))}
                          {field.kind === 'object' && (
                            allModels.filter(model => model.name.trim() !== '').length > 0 ? (
                              allModels.filter(model => model.name.trim() !== '').map(model => (
                                <SelectItem key={model.id} value={model.name} className="text-green-200 focus:bg-green-500/20 font-mono">{model.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem key="no-models" value="NoModelsAvailable" className="text-gray-400 focus:bg-gray-500/20 font-mono" disabled>
                                No models available - create a model first
                              </SelectItem>
                            )
                          )}
                          {field.kind === 'enum' && (
                            allEnums.filter(enumItem => enumItem.name.trim() !== '').length > 0 ? (
                              allEnums.filter(enumItem => enumItem.name.trim() !== '').map(enumItem => (
                                <SelectItem key={enumItem.id} value={enumItem.name} className="text-green-200 focus:bg-green-500/20 font-mono">{enumItem.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem key="no-enums" value="NoEnumsAvailable" className="text-gray-400 focus:bg-gray-500/20 font-mono" disabled>
                                No enums available - create an enum first
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Kind</Label>
                      <Select
                        value={field.kind}
                        onValueChange={(value: 'scalar' | 'object' | 'enum') => {
                          // Reset type when kind changes since available types are different
                          let defaultType = 'String'; // Default fallback
                          
                          if (value === 'scalar') {
                            defaultType = 'String';
                          } else if (value === 'object') {
                            const availableModels = allModels.filter(model => model.name.trim() !== '');
                            defaultType = availableModels.length > 0 ? availableModels[0].name : 'NoModelsAvailable';
                          } else if (value === 'enum') {
                            const availableEnums = allEnums.filter(enumItem => enumItem.name.trim() !== '');
                            defaultType = availableEnums.length > 0 ? availableEnums[0].name : 'NoEnumsAvailable';
                          }
                          
                          updateField(field.id, { kind: value, type: defaultType });
                        }}
                      >
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-green-500/30">
                          {FIELD_KINDS.map(kind => (
                            <SelectItem key={kind.value} value={kind.value} className="text-green-200 focus:bg-green-500/20 font-mono">
                              {kind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Title</Label>
                      <Input
                        value={field.title}
                        onChange={(e) => updateField(field.id, { title: e.target.value })}
                        placeholder="Display title"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono font-medium">Required</span>
                    </label>
                    <label className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      (field.kind === 'scalar' && ['String', 'Int', 'Float', 'DateTime'].includes(field.type))
                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20 cursor-pointer' 
                        : 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed opacity-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={field.unique}
                        onChange={(e) => updateField(field.id, { unique: e.target.checked })}
                        disabled={!(field.kind === 'scalar' && ['String', 'Int', 'Float', 'DateTime'].includes(field.type))}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-green-200 text-sm font-mono font-medium">Unique</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.list}
                        onChange={(e) => updateField(field.id, { list: e.target.checked })}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20"
                      />
                      <span className="text-green-200 text-sm font-mono font-medium">List</span>
                    </label>
                    <label className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      field.kind === 'object' 
                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20 cursor-pointer' 
                        : 'bg-gray-500/10 border-gray-500/20 cursor-not-allowed opacity-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={field.relationField}
                        onChange={(e) => updateField(field.id, { relationField: e.target.checked })}
                        disabled={field.kind !== 'object'}
                        className="w-4 h-4 text-green-400 bg-black/50 border-green-500/30 rounded focus:ring-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-green-200 text-sm font-mono font-medium">Relation</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-green-500/20">
                    <Button
                      onClick={() => setEditingField(null)}
                      className="btn-matrix flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Done</span>
                      </div>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteField(field.id)}
                      className="px-4"
                    >
                      <CrossIcon size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-between w-full p-3 cursor-pointer hover:bg-green-500/10 rounded-lg border-0 bg-transparent text-left transition-colors group"
                  onClick={() => setEditingField(field.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                      <span className="text-green-400 text-sm">📋</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-200 font-mono group-hover:text-green-100 transition-colors">
                        {field.name || 'Unnamed Field'}
                      </div>
                      <div className="text-sm text-green-400 font-mono">
                        {field.type} {field.required && '• Required'} {field.unique && '• Unique'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {field.required && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md border border-red-500/30 font-medium">
                        Required
                      </span>
                    )}
                    {field.unique && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md border border-purple-500/30 font-medium">
                        Unique
                      </span>
                    )}
                    <div className="text-green-400 group-hover:text-green-300 transition-colors">
                      <PencilEditIcon size={16} />
                    </div>
                  </div>
                </button>
              )}
            </div>
          ))}
          
          {model.fields.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-800/30 flex items-center justify-center border border-green-500/20">
                <div className="text-2xl opacity-60">📋</div>
              </div>
              <h4 className="text-lg font-semibold text-green-300 mb-2 font-mono">No Fields Defined</h4>
              <p className="text-green-500 text-sm font-mono mb-4">Add fields to define your model structure</p>
              <Button 
                onClick={addField}
                className="btn-matrix px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon size={16} />
                  <span>Add First Field</span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Forms Section */}
      <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 text-xl">📝</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-200 font-mono">Forms Configuration</h4>
              <p className="text-green-400 text-sm font-mono">Organize fields into forms for create/update operations</p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-blue-800/50 border border-blue-700">
              <span className="text-blue-300 text-xs font-medium font-mono">{model.forms?.length || 0} forms</span>
            </div>
          </div>
          <Button 
            onClick={() => {
              const newForm: AgentForm = {
                id: generateNewId('form', model.forms || []),
                name: `form_${(model.forms?.length || 0) + 1}`,
                title: `Form ${(model.forms?.length || 0) + 1}`,
                description: '',
                fields: model.fields.map((field, index) => ({
                  id: generateNewId('formField', []),
                  fieldId: field.id,
                  order: index,
                  required: field.required,
                  hidden: false
                })),
                order: (model.forms?.length || 0) + 1
              };
              
              onUpdate({
                ...model,
                forms: [...(model.forms || []), newForm]
              });
            }}
            className="btn-matrix px-4 py-2 text-sm font-mono"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} />
              <span>Add Form</span>
            </div>
          </Button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {model.forms && model.forms.length > 0 ? (
            model.forms.map((form) => (
              <div key={form.id} className="p-4 rounded-xl bg-black/30 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Form Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => {
                          const updatedForms = model.forms?.map(f => 
                            f.id === form.id ? { ...f, name: e.target.value } : f
                          );
                          onUpdate({ ...model, forms: updatedForms });
                        }}
                        placeholder="Internal form name"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-300 font-mono font-medium">Form Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => {
                          const updatedForms = model.forms?.map(f => 
                            f.id === form.id ? { ...f, title: e.target.value } : f
                          );
                          onUpdate({ ...model, forms: updatedForms });
                        }}
                        placeholder="Display title"
                        className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-green-300 font-mono font-medium">Description</Label>
                    <Input
                      value={form.description || ''}
                      onChange={(e) => {
                        const updatedForms = model.forms?.map(f => 
                          f.id === form.id ? { ...f, description: e.target.value } : f
                        );
                        onUpdate({ ...model, forms: updatedForms });
                      }}
                      placeholder="Form description"
                      className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-green-300 font-mono font-medium">Form Fields</Label>
                      <span className="text-blue-300 text-xs font-mono">{form.fields.length} fields</span>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {form.fields.map((formField) => {
                        const modelField = model.fields.find(f => f.id === formField.fieldId);
                        if (!modelField) return null;
                        
                        return (
                          <div key={`${model.id}-${form.id}-${formField.fieldId}-${formField.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-500/20">
                            <div className="flex-1">
                              <div className="text-green-200 font-mono text-sm">{modelField.name}</div>
                              <div className="text-green-400 font-mono text-xs">{modelField.type}</div>
                            </div>
                            
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={!formField.hidden}
                                onChange={(e) => {
                                  const updatedForms = model.forms?.map(f => 
                                    f.id === form.id ? {
                                      ...f,
                                      fields: f.fields.map(ff => 
                                        ff.id === formField.id && ff.fieldId === formField.fieldId ? { ...ff, hidden: !e.target.checked } : ff
                                      )
                                    } : f
                                  );
                                  onUpdate({ ...model, forms: updatedForms });
                                }}
                                className="w-4 h-4 text-blue-400 bg-black/50 border-blue-500/30 rounded focus:ring-blue-400/20"
                              />
                              <span className="text-blue-300 text-xs font-mono">Show</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-blue-500/20">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete form "${form.title}"?`)) {
                          const updatedForms = model.forms?.filter(f => f.id !== form.id);
                          onUpdate({ ...model, forms: updatedForms });
                        }
                      }}
                      className="px-4"
                    >
                      <CrossIcon size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-800/30 flex items-center justify-center border border-blue-500/20">
                <div className="text-2xl opacity-60">📝</div>
              </div>
              <h4 className="text-lg font-semibold text-green-300 mb-2 font-mono">No Forms Configured</h4>
              <p className="text-green-500 max-w-md mx-auto mb-6 font-mono">
                Create forms to organize fields for better user experience during create/update operations
              </p>
              <Button 
                onClick={() => {
                  const tempFormFields: AgentFormField[] = [];
                  const newForm: AgentForm = {
                    id: generateNewId('form', []),
                    name: 'default_form',
                    title: 'Default Form',
                    description: 'Main form for creating and editing records',
                    fields: model.fields.map((field, index) => {
                      const formField = {
                        id: generateNewId('formField', tempFormFields),
                        fieldId: field.id,
                        order: index,
                        required: field.required,
                        hidden: false
                      };
                      tempFormFields.push(formField);
                      return formField;
                    }),
                    order: 1
                  };
                  
                  onUpdate({ ...model, forms: [newForm] });
                }}
                className="btn-matrix px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon size={16} />
                  <span>Create First Form</span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Enum Editor Component
const EnumEditor = memo(({ 
  enumItem, 
  onUpdate, 
  onDelete 
}: { 
  enumItem: AgentEnum;
  onUpdate: (enumItem: AgentEnum) => void;
  onDelete: () => void;
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = useCallback(() => {
    const newField: AgentEnumField = {
      id: generateNewId('enumField', enumItem.fields),
      name: `VALUE${enumItem.fields.length + 1}`,
      type: 'String',
      defaultValue: ''
    };
    
    // Add to top of list and set to editing mode
    onUpdate({
      ...enumItem,
      fields: [newField, ...enumItem.fields]
    });
    setEditingField(newField.id);
  }, [enumItem, onUpdate]);

  const updateField = useCallback((fieldId: string, updates: Partial<AgentEnumField>) => {
    onUpdate({
      ...enumItem,
      fields: enumItem.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  }, [enumItem, onUpdate]);

  const deleteField = useCallback((fieldId: string) => {
    const field = enumItem.fields.find(f => f.id === fieldId);
    const fieldName = field?.name || 'this field';
    
    if (window.confirm(`Are you sure you want to delete field "${fieldName}"? This action cannot be undone.`)) {
    onUpdate({
      ...enumItem,
      fields: enumItem.fields.filter(field => field.id !== fieldId)
    });
    }
  }, [enumItem, onUpdate]);

  return (
    <div className="space-y-6">
      {/* Enum Basic Info */}
      <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <div className="text-purple-400 text-lg">🔢</div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-200 font-mono">Enumeration Configuration</h3>
            <p className="text-green-400 text-sm font-mono">Define controlled vocabulary values</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`enum-name-${enumItem.id}`} className="text-green-300 font-mono font-medium">Enum Name</Label>
          <Input
            id={`enum-name-${enumItem.id}`}
            value={enumItem.name}
            onChange={(e) => onUpdate({ ...enumItem, name: e.target.value })}
            placeholder="Enum name (e.g., UserRole, OrderStatus)"
            className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
          />
        </div>
      </div>

      {/* Values Section */}
      <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h4 className="text-lg font-semibold text-green-200 font-mono">Enumeration Values</h4>
            <div className="px-3 py-1 rounded-lg bg-purple-800/50 border border-purple-700">
              <span className="text-purple-300 text-xs font-medium font-mono">{enumItem.fields.length} values</span>
            </div>
          </div>
          <Button 
            onClick={addField}
            className="btn-matrix px-4 py-2 text-sm font-mono"
          >
            <div className="flex items-center gap-2">
              <PlusIcon size={16} />
              <span>Add Value</span>
            </div>
          </Button>
        </div>
        
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {enumItem.fields.map((field) => (
            <div key={field.id} className="p-4 rounded-xl bg-black/30 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              {editingField === field.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-green-300 font-mono font-medium">Value Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Value name (e.g., ADMIN, PENDING)"
                      className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-purple-500/20">
                    <Button
                      onClick={() => setEditingField(null)}
                      className="btn-matrix flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Done</span>
                      </div>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteField(field.id)}
                      className="px-4"
                    >
                      <CrossIcon size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-between w-full p-3 cursor-pointer hover:bg-purple-500/10 rounded-lg border-0 bg-transparent text-left transition-colors group"
                  onClick={() => setEditingField(field.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                      <span className="text-purple-400 text-sm">📝</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-200 font-mono group-hover:text-green-100 transition-colors">
                        {field.name || 'Unnamed Value'}
                      </div>
                      <div className="text-sm text-green-400 font-mono">
                        Enumeration value
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 group-hover:text-green-300 transition-colors">
                    <PencilEditIcon size={16} />
                  </div>
                </button>
              )}
            </div>
          ))}
          
          {enumItem.fields.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-800/30 flex items-center justify-center border border-purple-500/20">
                <div className="text-2xl opacity-60">📝</div>
              </div>
              <h4 className="text-lg font-semibold text-green-300 mb-2 font-mono">No Values Defined</h4>
              <p className="text-green-500 max-w-md mx-auto mb-6 font-mono">
                Add values to define your enumeration
              </p>
              <Button 
                onClick={addField}
                className="btn-matrix px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon size={16} />
                  <span>Add First Value</span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Action Editor Component
const ActionEditor = memo(({ 
  action, 
  onUpdate, 
  onDelete,
  allModels 
}: { 
  action: AgentAction;
  onUpdate: (action: AgentAction) => void;
  onDelete: () => void;
  allModels: AgentModel[];
}) => {
  return (
    <div className="space-y-6">
      {/* Action Basic Info */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <span className="text-orange-400 text-xl">⚡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-200 font-mono">Action Configuration</h3>
            <p className="text-green-400 text-sm font-mono">Define automated workflow behavior</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Action Name</Label>
            <Input
              value={action.name}
              onChange={(e) => onUpdate({ ...action, name: e.target.value })}
              placeholder="Action name (e.g., createUser, processOrder)"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Action Type</Label>
            <Select
              value={action.type}
              onValueChange={(value: 'Create' | 'Update') => 
                onUpdate({ ...action, type: value })
              }
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="Create" className="text-green-200 focus:bg-green-500/20 font-mono">Create</SelectItem>
                <SelectItem value="Update" className="text-green-200 focus:bg-green-500/20 font-mono">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <Label className="text-green-300 font-mono font-medium">Description</Label>
          <Textarea
            value={action.description}
            onChange={(e) => onUpdate({ ...action, description: e.target.value })}
            placeholder="Describe what this action does..."
            rows={3}
            className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
          />
        </div>
      </div>

      {/* Role Configuration */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Role Configuration</h4>
        </div>
        
        <div className="space-y-4">
            <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Access Role</Label>
            <Select
              value={action.role}
              onValueChange={(value: 'admin' | 'member') => onUpdate({
                  ...action,
                role: value
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="admin" className="text-green-200 focus:bg-green-500/20 font-mono">Admin Only</SelectItem>
                <SelectItem value="member" className="text-green-200 focus:bg-green-500/20 font-mono">All Members</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-green-500/70 text-sm font-mono">Control who can trigger this action</p>
            </div>
        </div>
      </div>

      {/* Data Source Configuration */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Data Source</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Source Type</Label>
            <Select
              value={action.dataSource.type}
              onValueChange={(value: 'custom' | 'database') => 
                onUpdate({
                  ...action,
                  dataSource: {
                    type: value,
                    ...(value === 'database' ? { database: { models: [] } } : { customFunction: { code: '' } })
                  }
                })
              }
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="database" className="text-green-200 focus:bg-green-500/20 font-mono">Database Query</SelectItem>
                <SelectItem value="custom" className="text-green-200 focus:bg-green-500/20 font-mono">Custom Function</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {action.dataSource.type === 'custom' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">Custom Code</Label>
              <Textarea
                value={action.dataSource.customFunction?.code || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  dataSource: {
                    ...action.dataSource,
                    customFunction: {
                      ...action.dataSource.customFunction,
                      code: e.target.value
                    }
                  }
                })}
                placeholder="// Custom function code here..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Execute Configuration */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Execution Logic</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Execution Type</Label>
            <Select
              value={action.execute.type}
              onValueChange={(value: 'code' | 'prompt') => 
                onUpdate({
                  ...action,
                  execute: value === 'code' 
                    ? { type: 'code', code: { script: '' } }
                    : { type: 'prompt', prompt: { template: '' } }
                })
              }
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="code" className="text-green-200 focus:bg-green-500/20 font-mono">Code Script</SelectItem>
                <SelectItem value="prompt" className="text-green-200 focus:bg-green-500/20 font-mono">AI Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {action.execute.type === 'code' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">Script Code</Label>
              <Textarea
                value={action.execute.code?.script || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  execute: {
                    ...action.execute,
                    code: {
                      ...action.execute.code,
                      script: e.target.value
                    }
                  }
                })}
                placeholder="// Processing script here..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono text-sm"
              />
            </div>
          )}
          
          {action.execute.type === 'prompt' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">AI Prompt Template</Label>
              <Textarea
                value={action.execute.prompt?.template || ''}
                onChange={(e) => onUpdate({
                  ...action,
                  execute: {
                    ...action.execute,
                    prompt: {
                      ...action.execute.prompt,
                      template: e.target.value
                    }
                  }
                })}
                placeholder="Analyze the following data and..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results Configuration */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Results Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Target Model</Label>
            <Select
              value={action.results.model}
              onValueChange={(value) => onUpdate({
                ...action,
                results: { ...action.results, model: value }
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                {allModels.filter(model => model.name.trim() !== '').map(model => (
                  <SelectItem key={model.id} value={model.name} className="text-green-200 focus:bg-green-500/20 font-mono">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex justify-end pt-4 border-t border-green-500/20">
        <Button
          variant="destructive"
          onClick={onDelete}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 font-mono"
        >
          <CrossIcon size={16} />
          <span className="ml-2">Delete Action</span>
        </Button>
      </div>
    </div>
  );
});

// Models List Editor Component
const ModelsListEditor = memo(({ models, onModelsChange, updateMetadata, status }: {
  models: AgentModel[];
  onModelsChange: (models: AgentModel[]) => void;
  updateMetadata: (updates: Partial<AgentArtifactMetadata>) => void;
  status: 'streaming' | 'idle';
}) => {
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [isAddingModel, setIsAddingModel] = useState(false);

  // Helper function to check if a model has a published field
  const hasPublishedField = useCallback((model: AgentModel): boolean => {
    return model.fields.some(field => field.name === 'published' && field.type === 'Boolean');
  }, []);

  const addModel = useCallback(() => {
    const newModel: AgentModel = {
      id: generateNewId('model', models || []),
      name: `Model${(models?.length || 0) + 1}`,
      emoji: '🗃️', // Default emoji, will be auto-generated by AI
      idField: 'id',
      displayFields: [],
      fields: [
        {
          id: 'fld1',
          name: 'id',
          type: 'String',
          isId: true,
          unique: true,
          list: false,
          required: true,
          kind: 'scalar',
          relationField: false,
          title: 'ID',
          sort: false,
          order: 1
        },
        {
          id: 'fld2',
          name: 'published',
          type: 'Boolean',
          isId: false,
          unique: false,
          list: false,
          required: false,
          kind: 'scalar',
          relationField: false,
          title: 'Published',
          sort: false,
          order: 2,
          defaultValue: 'false'
        }
      ],
      enums: [],
      hasPublishedField: true
    };
    
    // Add to top of list and set to editing mode
    onModelsChange([newModel, ...(models || [])]);
    setEditingModelId(newModel.id);
  }, [models, onModelsChange]);

  const updateModel = useCallback((updatedModel: AgentModel) => {
    const updatedModels = models.map(model => 
      model.id === updatedModel.id ? updatedModel : model
    );
    onModelsChange(updatedModels);
  }, [models, onModelsChange]);

  const deleteModel = useCallback((modelId: string) => {
    const model = models.find(m => m.id === modelId);
    const modelName = model?.name || 'this model';
    
    if (window.confirm(`Are you sure you want to delete model "${modelName}"? This action cannot be undone and will remove all associated data.`)) {
      onModelsChange(models.filter(model => model.id !== modelId));
      if (editingModelId === modelId) {
        setEditingModelId(null);
      }
    }
  }, [models, onModelsChange, editingModelId]);

  const viewModelData = useCallback((modelId: string) => {
    console.log('🔍 Data button clicked for modelId:', modelId);
    updateMetadata({
      dataManagement: {
        viewingModelId: modelId,
        editingRecordId: null,
        isAddingRecord: false
      }
    });
    console.log('🔍 Called updateMetadata with viewingModelId:', modelId);
  }, [updateMetadata]);

  const backToModelsList = useCallback(() => {
    setEditingModelId(null);
    updateMetadata({ dataManagement: null });
  }, [updateMetadata]);

  if (editingModelId && models.find(m => m.id === editingModelId)) {
    const editingModel = models.find(m => m.id === editingModelId)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            onClick={backToModelsList}
            className="btn-matrix px-4 py-2 mx-4"
          >
            ← Back
          </Button>
          <h3 className="text-2xl font-bold text-green-200 font-mono">Editing Model: {editingModel.name}</h3>
         
        </div>
        <ModelEditor
          model={editingModel}
          onUpdate={updateModel}
          onDelete={() => deleteModel(editingModel.id)}
          allModels={models}
          allEnums={editingModel.enums || []}
          updateModel={updateModel}
          allActions={[]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Updated to match Schedules style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Data Models</h3>
          <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
            <span className="text-green-300 text-sm font-medium font-mono">{models.length} models</span>
          </div>
        </div>
        <Button 
          onClick={addModel}
          disabled={status === 'streaming'}
          className="btn-matrix px-3 sm:px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Add Model</span>
          </div>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {models.map((model) => (
          <div key={model.id} className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-colors">
            {/* Mobile-first layout */}
            <div className="flex flex-col gap-4">
              {/* Top section with icon, title, and stats */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 flex-shrink-0">
                  <span className="text-lg sm:text-xl">{model.emoji || '🗃️'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono break-words">{model.name || 'Unnamed Model'}</h4>
                  {model.description && (
                    <p className="text-green-300 text-xs sm:text-sm font-mono mt-1 opacity-80 leading-relaxed">
                      {/* Truncate on mobile for better layout */}
                      <span className="sm:hidden">
                        {model.description.length > 60 
                          ? `${model.description.substring(0, 60)}...` 
                          : model.description}
                      </span>
                      <span className="hidden sm:inline">
                        {model.description}
                      </span>
                    </p>
                  )}
                  {/* Stats row - responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                    <span className="text-green-400 text-xs sm:text-sm font-mono">
                      {model.fields.length} fields • {model.enums?.length || 0} enums
                    </span>
                    <span className="text-blue-400 text-xs sm:text-sm font-mono">
                      {model.records?.length || 0} records
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons - Full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-green-500/10">
                <Button
                  onClick={() => setEditingModelId(model.id)}
                  size="sm"
                  className="btn-matrix px-3 py-2 text-xs sm:text-sm w-full sm:w-auto flex-1 sm:flex-none"
                >
                  <span>Edit Model</span>
                </Button>
                <Button
                  onClick={() => viewModelData(model.id)}
                  size="sm"
                  className="btn-matrix px-3 py-2 text-xs sm:text-sm w-full sm:w-auto flex-1 sm:flex-none"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm">📊</span>
                    <span>View Data</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        ))}

        {models.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-green-800/30 flex items-center justify-center border border-green-500/20">
              <span className="text-2xl sm:text-4xl">🗃️</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Models Defined</h4>
            <p className="text-green-500 text-sm font-mono mb-6 px-4">Create your first data model to get started</p>
            <Button 
              onClick={addModel}
              disabled={status === 'streaming'}
              className="btn-matrix px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto max-w-xs"
            >
              <div className="flex items-center gap-2 justify-center">
                <PlusIcon size={16} />
                <span>Create First Model</span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Actions List Editor Component  
const ActionsListEditor = memo(({ 
  actions, 
  updateActions, 
  editingId, 
  setEditingId, 
  addAction,
  models,
  status
}: { 
  actions: AgentAction[];
  updateActions: (actions: AgentAction[]) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  addAction: () => void;
  models: AgentModel[];
  status: 'streaming' | 'idle';
}) => {
  const updateAction = useCallback((updatedAction: AgentAction) => {
    updateActions(actions.map(action => 
      action.id === updatedAction.id ? updatedAction : action
    ));
  }, [actions, updateActions]);

  const deleteAction = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    const actionName = action?.name || 'this action';
    
    if (window.confirm(`Are you sure you want to delete action "${actionName}"? This action cannot be undone.`)) {
      updateActions(actions.filter(action => action.id !== actionId));
      if (editingId === actionId) {
        setEditingId(null);
      }
    }
  }, [actions, updateActions, editingId, setEditingId]);

  if (editingId && actions.find(a => a.id === editingId)) {
    const editingAction = actions.find(a => a.id === editingId)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            onClick={() => setEditingId(null)}
            className="btn-matrix px-4 py-2 mx-4"
          >
            ← Back
          </Button>
          <h3 className="text-2xl font-bold text-green-200 font-mono">Editing Action: {editingAction.name}</h3>
         
        </div>
        <ActionEditor
          action={editingAction}
          onUpdate={updateAction}
          onDelete={() => deleteAction(editingAction.id)}
          allModels={models}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Updated to match Schedules style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Automated Actions</h3>
          <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
            <span className="text-green-300 text-sm font-medium font-mono">{actions.length} actions</span>
          </div>
        </div>
        <Button 
          onClick={addAction}
          disabled={status === 'streaming'}
          className="btn-matrix px-3 sm:px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Add Action</span>
          </div>
        </Button>
      </div>

      <div className="grid gap-4">
        {actions.map((action) => (
          <div key={action.id} className="p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                  <span className="text-lg sm:text-xl">{action.emoji || '⚡'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono break-words">{action.name || 'Unnamed Action'}</h4>
                  <p className="text-green-400 text-xs sm:text-sm font-mono mb-2">
                    {action.type} • {action.role}
                  </p>
                  {action.description && (
                    <p className="text-green-300/80 text-xs sm:text-sm font-mono leading-relaxed">
                      {action.description.length > 100 
                        ? `${action.description.substring(0, 100)}...` 
                        : action.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:ml-4">
                <Button
                  onClick={() => {
                    console.log('Running action:', action.id);
                    alert(`Running action: ${action.name}`);
                  }}
                  className="btn-matrix px-3 sm:px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <span>▶️</span>
                    <span className="text-xs sm:text-sm">Run</span>
                  </div>
                </Button>
                <Button
                  onClick={() => setEditingId(action.id)}
                  className="btn-matrix px-3 sm:px-4 py-2"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <PencilEditIcon size={14} />
                    <span className="text-xs sm:text-sm">Edit</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-blue-800/30 flex items-center justify-center border border-blue-500/20">
              <span className="text-3xl sm:text-4xl">⚡</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Actions Defined</h4>
            <p className="text-green-500 text-sm font-mono mb-4 sm:mb-6 px-4">Create automated actions for your agent</p>
            <Button 
              onClick={addAction}
              disabled={status === 'streaming'}
              className="btn-matrix px-4 sm:px-6 py-3"
            >
              <div className="flex items-center gap-2">
                <PlusIcon size={16} />
                <span>Create First Action</span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Schedules List Editor Component
const SchedulesListEditor = memo(({ 
  schedules, 
  updateSchedules, 
  editingId, 
  setEditingId, 
  addSchedule,
  models,
  status
}: { 
  schedules: AgentSchedule[];
  updateSchedules: (schedules: AgentSchedule[]) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  addSchedule: () => void;
  models: AgentModel[];
  status: 'streaming' | 'idle';
}) => {
  const updateSchedule = useCallback((updatedSchedule: AgentSchedule) => {
    updateSchedules(schedules.map(schedule => 
      schedule.id === updatedSchedule.id ? updatedSchedule : schedule
    ));
  }, [schedules, updateSchedules]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const scheduleName = schedule?.name || 'this schedule';
    
    if (window.confirm(`Are you sure you want to delete schedule "${scheduleName}"? This action cannot be undone.`)) {
      updateSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
      if (editingId === scheduleId) {
        setEditingId(null);
      }
    }
  }, [schedules, updateSchedules, editingId, setEditingId]);

  if (editingId && schedules.find(s => s.id === editingId)) {
    const editingSchedule = schedules.find(s => s.id === editingId)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            onClick={() => setEditingId(null)}
            className="btn-matrix px-4 py-2 mx-4"
          >
            ← Back
          </Button>
          <h3 className="text-2xl font-bold text-green-200 font-mono">Editing Schedule: {editingSchedule.name}</h3>

        </div>
        <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
          <ScheduleEditor
            schedule={editingSchedule}
            onUpdate={updateSchedule}
            onDelete={() => deleteSchedule(editingSchedule.id)}
            allModels={models}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Schedules & Timing</h3>
          <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
            <span className="text-green-300 text-sm font-medium font-mono">{schedules.length} schedules</span>
          </div>
        </div>
        <Button 
          onClick={addSchedule}
          disabled={status === 'streaming'}
          className="btn-matrix px-3 sm:px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Add Schedule</span>
          </div>
        </Button>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                  <span className="text-lg sm:text-xl">{schedule.emoji || '⏰'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono break-words">{schedule.name || 'Unnamed Schedule'}</h4>
                  <p className="text-green-400 text-xs sm:text-sm font-mono mb-2">
                    {schedule.type} • {schedule.interval.pattern} • {schedule.interval.active ? 'Active' : 'Inactive'}
                  </p>
                  {schedule.description && (
                    <p className="text-green-300/80 text-xs sm:text-sm font-mono leading-relaxed">
                      {schedule.description.length > 100 
                        ? `${schedule.description.substring(0, 100)}...` 
                        : schedule.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Mobile-optimized controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Toggle activation
                      const updatedSchedule = {
                        ...schedule,
                        interval: { ...schedule.interval, active: !schedule.interval.active }
                      };
                      updateSchedule(updatedSchedule);
                    }}
                    className={`font-mono px-3 sm:px-4 py-2 flex-1 sm:flex-initial ${
                      schedule.interval.active 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span>{schedule.interval.active ? '⏸️' : '▶️'}</span>
                      <span className="text-xs sm:text-sm">{schedule.interval.active ? 'Pause' : 'Activate'}</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setEditingId(schedule.id)}
                    className="btn-matrix px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <PencilEditIcon size={14} />
                      <span className="text-xs sm:text-sm">Edit</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-purple-800/30 flex items-center justify-center border border-purple-500/20">
              <span className="text-3xl sm:text-4xl">⏰</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Schedules Defined</h4>
            <p className="text-green-500 text-sm font-mono mb-4 sm:mb-6 px-4">Create scheduled tasks for your agent</p>
            <Button 
              onClick={addSchedule}
              disabled={status === 'streaming'}
              className="btn-matrix px-4 sm:px-6 py-3"
            >
              <div className="flex items-center gap-2">
                <PlusIcon size={16} />
                <span>Create First Schedule</span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// Model Data Viewer Component
const ModelDataViewer = memo(({ 
  model, 
  onUpdateModel, 
  onBack,
  allModels
}: { 
  model: AgentModel;
  onUpdateModel: (model: AgentModel) => void;
  onBack: () => void;
  allModels: AgentModel[];
}) => {
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const records = model.records || [];

  const addRecord = useCallback(() => {
    setIsAddingRecord(true);
    setEditingRecordId(null);
  }, []);

  const saveRecord = useCallback((recordData: Record<string, any>, recordId?: string) => {
    const now = new Date().toISOString();
    
    if (recordId) {
      // Update existing record
      const updatedRecords = records.map(record => 
        record.id === recordId 
          ? { ...record, data: recordData, updatedAt: now }
          : record
      );
      onUpdateModel({ ...model, records: updatedRecords });
    } else {
      // Add new record
      const newRecord: ModelRecord = {
        id: generateNewId('record', records),
        modelId: model.id,
        data: recordData,
        createdAt: now,
        updatedAt: now
      };
      onUpdateModel({ ...model, records: [...records, newRecord] });
    }
    
    setEditingRecordId(null);
    setIsAddingRecord(false);
  }, [model, records, onUpdateModel]);

  const deleteRecord = useCallback((recordId: string) => {
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      const updatedRecords = records.filter(record => record.id !== recordId);
      onUpdateModel({ ...model, records: updatedRecords });
      setEditingRecordId(null);
    }
  }, [model, records, onUpdateModel]);

  const cancelEdit = useCallback(() => {
    setEditingRecordId(null);
    setIsAddingRecord(false);
  }, []);

  // Show record editor when adding or editing
  if (isAddingRecord || editingRecordId) {
    const editingRecord = editingRecordId ? records.find(r => r.id === editingRecordId) : null;
    return (
      <RecordEditor
        model={model}
        allModels={allModels}
        record={editingRecord}
        onSave={saveRecord}
        onCancel={cancelEdit}
        onDelete={editingRecord ? () => deleteRecord(editingRecord.id) : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={onBack} className="btn-matrix px-3 py-2 w-fit">
            ← Back
          </Button>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">{model.name} Data</h3>
            <p className="text-green-400 text-xs sm:text-sm font-mono">
              {records.length} records • {model.fields.length} fields
            </p>
          </div>
        </div>
        <Button 
          onClick={addRecord}
          className="btn-matrix px-3 sm:px-4 py-2 w-full sm:w-auto"
        >
          <div className="flex items-center gap-2 justify-center">
            <PlusIcon size={16} />
            <span className="text-sm sm:text-base">Add Record</span>
          </div>
        </Button>
      </div>

      {/* Model Description */}
      {model.description && (
        <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
          <p className="text-green-300 text-xs sm:text-sm font-mono leading-relaxed">{model.description}</p>
        </div>
      )}

      {/* Records Display */}
      {records.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-xl border border-green-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-500/10 border-b border-green-500/20">
                  <tr>
                    {model.fields.slice(0, 4).map(field => (
                      <th key={field.id} className="px-4 py-3 text-left">
                        <span className="text-green-300 text-sm font-medium font-mono">
                          {field.name}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left">
                      <span className="text-green-300 text-sm font-medium font-mono">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-b border-green-500/10 hover:bg-green-500/5">
                      {model.fields.slice(0, 4).map(field => (
                        <td key={field.id} className="px-4 py-3">
                          <span className="text-green-200 text-sm font-mono">
                            {String(record.data[field.name] || '-')}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => setEditingRecordId(record.id)}
                          size="sm"
                          className="btn-matrix px-3 py-1 text-xs"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {records.map(record => {
              // Show first 3 fields + 1 more if available
              const displayFields = model.fields.slice(0, 3);
              const hasMoreFields = model.fields.length > 3;
              
              return (
                <div key={record.id} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                  <div className="space-y-3">
                    {/* Record Fields */}
                    <div className="space-y-2">
                      {displayFields.map(field => {
                        const value = record.data[field.name];
                        const displayValue = value !== undefined && value !== null && value !== '' 
                          ? String(value) 
                          : '-';
                        
                        return (
                          <div key={field.id} className="flex justify-between items-start gap-3">
                            <span className="text-green-300 text-xs font-medium font-mono flex-shrink-0">
                              {field.name}
                              {field.required && <span className="text-red-400 ml-1">*</span>}:
                            </span>
                            <span className="text-green-200 text-xs font-mono text-right break-words">
                              {displayValue.length > 30 
                                ? `${displayValue.substring(0, 30)}...` 
                                : displayValue}
                            </span>
                          </div>
                        );
                      })}
                      
                      {hasMoreFields && (
                        <div className="pt-1 border-t border-green-500/10">
                          <span className="text-green-400 text-xs font-mono opacity-60">
                            +{model.fields.length - 3} more fields
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-2 border-t border-green-500/10">
                      <Button
                        onClick={() => setEditingRecordId(record.id)}
                        size="sm"
                        className="btn-matrix px-3 py-2 text-xs w-full"
                      >
                        Edit Record
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-green-800/30 flex items-center justify-center border border-green-500/20">
            <span className="text-2xl sm:text-4xl">📊</span>
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Records Yet</h4>
          <p className="text-green-500 text-sm font-mono mb-6 px-4">Add the first record to your {model.name} model</p>
          <Button 
            onClick={addRecord}
            className="btn-matrix px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto max-w-xs"
          >
            <div className="flex items-center gap-2 justify-center">
              <PlusIcon size={16} />
              <span>Add First Record</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
});

// Record Editor Component  
const RecordEditor = memo(({ 
  model, 
  record, 
  onSave, 
  onCancel, 
  onDelete,
  allModels = [] 
}: { 
  model: AgentModel;
  record?: ModelRecord | null;
  onSave: (data: Record<string, any>, recordId?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  allModels?: AgentModel[];
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    record?.data || {}
  );

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const getFieldValue = useCallback((field: AgentField) => {
    return formData[field.name] || (field.list ? [] : '');
  }, [formData]);

  const handleSave = useCallback(() => {
    onSave(formData, record?.id);
  }, [formData, onSave, record?.id]);

  const renderFieldInput = (field: AgentField) => {
    const fieldId = `field-${field.id}`;
    
    // Don't render input for ID fields - they should be auto-generated
    if (field.isId) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
          <span className="text-gray-400 text-sm font-mono">
            {record ? String(record.data[field.name] || record.id) : 'Auto-generated on save'}
          </span>
          <span className="text-xs text-gray-500 font-mono bg-gray-700 px-2 py-1 rounded">
            ID
          </span>
        </div>
      );
    }

    // Handle relation fields
    if (field.relationField && field.kind === 'object') {
      const relatedModel = allModels.find(m => m.name === field.type);
      
      if (!relatedModel) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-sm font-mono">
              Related model "{field.type}" not found
            </span>
          </div>
        );
      }

      const relatedRecords = relatedModel.records || [];
      
      if (relatedRecords.length === 0) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm font-mono">
              No {field.type} records available
            </span>
          </div>
        );
      }

      if (field.list) {
        // Multi-select for list relations
        const selectedIds = Array.isArray(getFieldValue(field)) ? getFieldValue(field) : [];
        
        return (
          <div className="space-y-2">
            <div className="text-green-400 text-xs font-mono mb-2">
              Select multiple {field.type} records ({selectedIds.length} selected)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-black/30 border border-green-500/20">
              {relatedRecords.map(relatedRecord => {
                const isSelected = selectedIds.includes(relatedRecord.id);
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <label key={relatedRecord.id} className="flex items-center gap-2 p-2 hover:bg-green-500/10 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelectedIds = e.target.checked
                          ? [...selectedIds, relatedRecord.id]
                          : selectedIds.filter((id: string) => id !== relatedRecord.id);
                        updateField(field.name, newSelectedIds);
                      }}
                      className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
                    />
                    <span className="text-green-200 text-sm font-mono flex-1">
                      {String(displayValue)}
                    </span>
                    <span className="text-green-500 text-xs font-mono">
                      ID: {relatedRecord.id}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Single select for non-list relations
        const selectedId = getFieldValue(field);
        
        return (
          <Select
            value={selectedId || ''}
            onValueChange={(value) => updateField(field.name, value || null)}
          >
            <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
              <SelectValue placeholder={`Select ${field.type}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="" className="text-green-200 focus:bg-green-500/20 font-mono">
                None selected
              </SelectItem>
              {relatedRecords.map(relatedRecord => {
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <SelectItem 
                    key={relatedRecord.id} 
                    value={relatedRecord.id} 
                    className="text-green-200 focus:bg-green-500/20 font-mono"
                  >
                    {String(displayValue)} (ID: {relatedRecord.id})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      }
    }
    
    if (field.type === 'Boolean') {
      return (
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(getFieldValue(field))}
            onChange={(e) => updateField(field.name, e.target.checked)}
            className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
          />
          <span className="text-green-400 text-sm font-mono">
            {getFieldValue(field) ? 'True' : 'False'}
          </span>
        </div>
      );
    } else if (field.type === 'Int' || field.type === 'Float') {
      return (
        <Input
          id={fieldId}
          type="number"
          step={field.type === 'Float' ? '0.01' : '1'}
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, field.type === 'Int' ? Number.parseInt(e.target.value) || 0 : Number.parseFloat(e.target.value) || 0)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    } else if (field.type === 'DateTime') {
      return (
        <Input
          id={fieldId}
          type="datetime-local"
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, e.target.value)}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    } else {
      return (
        <Input
          id={fieldId}
          type="text"
          value={getFieldValue(field)}
          onChange={(e) => updateField(field.name, e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
        />
      );
    }
  };

  // If model has forms, display each form as a section in order
  // If no forms, display all fields in a single section
  const formsToDisplay = model.forms && model.forms.length > 0 
    ? model.forms.sort((a, b) => a.order - b.order)
    : null;

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={onCancel} className="btn-matrix px-3 py-2 w-fit">
            ← Cancel
          </Button>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">
              {record ? 'Edit' : 'Add'} {model.name} Record
            </h3>
            <p className="text-green-400 text-xs sm:text-sm font-mono">
              Fill in the fields below using {formsToDisplay ? `${formsToDisplay.length} forms` : 'all fields'}
            </p>
          </div>
        </div>
        
        {/* Action buttons - Responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          {onDelete && (
            <Button 
              onClick={onDelete}
              variant="destructive"
              className="px-3 sm:px-4 py-2 w-full sm:w-auto order-2 sm:order-1"
            >
              <div className="flex items-center gap-2 justify-center">
                <CrossIcon size={16} />
                <span>Delete Record</span>
              </div>
            </Button>
          )}
          <Button 
            onClick={handleSave}
            className="btn-matrix px-3 sm:px-4 py-2 w-full sm:w-auto order-1 sm:order-2"
          >
            <span>Save Record</span>
          </Button>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {formsToDisplay ? (
          // Display each form as a separate section
          formsToDisplay.map((form) => {
            const formFields = form.fields
              .sort((a, b) => a.order - b.order)
              .map(formField => {
                const modelField = model.fields.find(f => f.id === formField.fieldId);
                return modelField && !formField.hidden ? { ...modelField, formField } : null;
              })
              .filter(Boolean) as (AgentField & { formField: AgentFormField })[];

            if (formFields.length === 0) return null;

            return (
              <div key={form.id} className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                  <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono">{form.title}</h4>
                  {form.description && (
                    <p className="text-green-400 text-xs sm:text-sm font-mono">- {form.description}</p>
                  )}
                  <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
                    <span className="text-green-300 text-xs font-medium font-mono">{formFields.length} fields</span>
                  </div>
                </div>
                
                <div className="grid gap-4 max-w-4xl mx-auto">
                  {formFields.map(field => {
                    const isRequired = field.formField.required !== undefined ? 
                      field.formField.required : field.required;
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`field-${field.id}`} className="text-green-300 font-mono font-medium text-xs sm:text-sm">
                          {field.title || field.name}
                          {isRequired && <span className="text-red-400 ml-1">*</span>}
                          <span className="text-green-500 text-xs ml-2">({field.type})</span>
                        </Label>
                        {renderFieldInput(field)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Display all fields in a single section if no forms
          <div className="p-4 sm:p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
              <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono">All Fields</h4>
              <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
                <span className="text-green-300 text-xs font-medium font-mono">{model.fields.length} fields</span>
              </div>
            </div>
            
            <div className="grid gap-4 max-w-4xl mx-auto">
              {model.fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`} className="text-green-300 font-mono font-medium text-xs sm:text-sm">
                    {field.title || field.name}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                    <span className="text-green-500 text-xs ml-2">({field.type})</span>
                  </Label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Schedule Editor Component
const ScheduleEditor = memo(({ 
  schedule, 
  onUpdate, 
  onDelete,
  allModels
}: { 
  schedule: AgentSchedule;
  onUpdate: (schedule: AgentSchedule) => void;
  onDelete: () => void;
  allModels: AgentModel[];
}) => {
  return (
    <div className="space-y-6">
      {/* Name and Description */}
      <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Schedule Configuration</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Schedule Name</Label>
            <Input
              value={schedule.name}
              onChange={(e) => onUpdate({ ...schedule, name: e.target.value })}
              placeholder="e.g., Daily Report Generation"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Schedule Type</Label>
            <Select
              value={schedule.type}
              onValueChange={(value: 'Create' | 'Update') => onUpdate({ ...schedule, type: value })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="Create" className="text-green-200 focus:bg-green-500/20 font-mono">Create Records</SelectItem>
                <SelectItem value="Update" className="text-green-200 focus:bg-green-500/20 font-mono">Update Records</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Required Role</Label>
            <Select
              value={schedule.role}
              onValueChange={(value: 'admin' | 'member') => onUpdate({ ...schedule, role: value })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="admin" className="text-green-200 focus:bg-green-500/20 font-mono">Admin Only</SelectItem>
                <SelectItem value="member" className="text-green-200 focus:bg-green-500/20 font-mono">All Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-green-300 font-mono font-medium">Description</Label>
          <Textarea
            value={schedule.description}
            onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
            placeholder="Describe what this schedule does and its business purpose..."
            rows={3}
            className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
          />
          {schedule.description && (
            <p className="text-green-400 text-sm font-mono mt-2">{schedule.description}</p>
          )}
        </div>
      </div>

      {/* Schedule Interval */}
      <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Schedule Timing</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Schedule Pattern</Label>
            <Input
              value={schedule.interval.pattern}
              onChange={(e) => onUpdate({
                ...schedule,
                interval: { ...schedule.interval, pattern: e.target.value }
              })}
              placeholder="e.g., daily, weekly, 0 9 * * 1-5"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Timezone</Label>
            <Input
              value={schedule.interval.timezone || ''}
              onChange={(e) => onUpdate({
                ...schedule,
                interval: { ...schedule.interval, timezone: e.target.value }
              })}
              placeholder="e.g., America/New_York"
              className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Status</Label>
            <Select
              value={schedule.interval.active ? 'active' : 'inactive'}
              onValueChange={(value) => onUpdate({
                ...schedule,
                interval: { ...schedule.interval, active: value === 'active' }
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="active" className="text-green-200 focus:bg-green-500/20 font-mono">Active</SelectItem>
                <SelectItem value="inactive" className="text-green-200 focus:bg-green-500/20 font-mono">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Source Configuration */}
      <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Data Source Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Data Source Type</Label>
            <Select
              value={schedule.dataSource.type}
              onValueChange={(value: 'custom' | 'database') => onUpdate({
                ...schedule,
                dataSource: { ...schedule.dataSource, type: value }
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="database" className="text-green-200 focus:bg-green-500/20 font-mono">Database Query</SelectItem>
                <SelectItem value="custom" className="text-green-200 focus:bg-green-500/20 font-mono">Custom Function</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {schedule.dataSource.type === 'custom' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">Custom Function Code</Label>
              <Textarea
                value={schedule.dataSource.customFunction?.code || ''}
                onChange={(e) => onUpdate({
                  ...schedule,
                  dataSource: {
                    ...schedule.dataSource,
                    customFunction: {
                      ...schedule.dataSource.customFunction,
                      code: e.target.value
                    }
                  }
                })}
                placeholder="// Custom data fetching logic here..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Execution Configuration */}
      <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Execution Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Execution Type</Label>
            <Select
              value={schedule.execute.type}
              onValueChange={(value: 'code' | 'prompt') => onUpdate({
                ...schedule,
                execute: value === 'code' 
                  ? { type: 'code', code: { script: '' } }
                  : { type: 'prompt', prompt: { template: '' } }
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                <SelectItem value="code" className="text-green-200 focus:bg-green-500/20 font-mono">JavaScript Code</SelectItem>
                <SelectItem value="prompt" className="text-green-200 focus:bg-green-500/20 font-mono">AI Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {schedule.execute.type === 'code' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">Script Code</Label>
              <Textarea
                value={schedule.execute.code?.script || ''}
                onChange={(e) => onUpdate({
                  ...schedule,
                  execute: {
                    ...schedule.execute,
                    code: {
                      ...schedule.execute.code,
                      script: e.target.value
                    }
                  }
                })}
                placeholder="// Processing script here..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono text-sm"
              />
            </div>
          )}
          
          {schedule.execute.type === 'prompt' && (
            <div className="space-y-2">
              <Label className="text-green-300 font-mono font-medium">AI Prompt Template</Label>
              <Textarea
                value={schedule.execute.prompt?.template || ''}
                onChange={(e) => onUpdate({
                  ...schedule,
                  execute: {
                    ...schedule.execute,
                    prompt: {
                      ...schedule.execute.prompt,
                      template: e.target.value
                    }
                  }
                })}
                placeholder="Analyze the following data and..."
                rows={6}
                className="bg-black/50 border-green-500/30 text-green-200 placeholder-green-500/50 focus:border-green-400 focus:ring-green-400/20 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results Configuration */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <h4 className="text-lg font-semibold text-green-200 font-mono">Results Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-300 font-mono font-medium">Target Model</Label>
            <Select
              value={schedule.results.model}
              onValueChange={(value) => onUpdate({
                ...schedule,
                results: { ...schedule.results, model: value }
              })}
            >
              <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-black border-green-500/30">
                {allModels.filter(model => model.name.trim() !== '').map(model => (
                  <SelectItem key={model.id} value={model.name} className="text-green-200 focus:bg-green-500/20 font-mono">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Schedule Controls */}
      <div className="flex justify-end pt-4 border-t border-green-500/20">
        <Button
          variant="destructive"
          onClick={onDelete}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 font-mono"
        >
          <CrossIcon size={16} />
          <span className="ml-2">Delete Schedule</span>
        </Button>
      </div>
    </div>
  );
});

// Main Agent Builder Component
const AgentBuilderContent = memo(({
  content,
  onSaveContent,
  status,
  mode,
  isCurrentVersion,
  currentVersionIndex,
  getDocumentContentById,
  isLoading,
  metadata,
  setMetadata,
  setMessages,
}: {
  content: string;
  onSaveContent: (content: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  mode: 'edit' | 'diff';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: AgentArtifactMetadata | null;
  setMetadata: (metadata: AgentArtifactMetadata) => void;
  setMessages?: UseChatHelpers['setMessages'];
}) => {
  const { artifact } = useArtifact();
  
  // Initialize metadata with defaults if null
  const safeMetadata: AgentArtifactMetadata = {
    selectedTab: metadata?.selectedTab || 'models',
    editingModel: metadata?.editingModel || null,
    editingAction: metadata?.editingAction || null,
    editingSchedule: metadata?.editingSchedule || null,
    viewingModelData: metadata?.viewingModelData || null,
    editingRecord: metadata?.editingRecord || null,
    currentStep: metadata?.currentStep,
    stepProgress: metadata?.stepProgress,
    stepMessages: metadata?.stepMessages,
    dataManagement: metadata?.dataManagement || null
  };

  const [agentData, setAgentData] = useState<AgentData>(() => {
    console.log('🚀 Initializing agent data with content:', {
      hasContent: !!content,
      contentLength: content?.length || 0,
      contentPreview: content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : 'none'
    });

    try {
      // Handle case where content might be empty, whitespace, or just '{}'
      if (!content || content.trim() === '' || content.trim() === '{}') {
        console.log('📝 Using default agent data (no meaningful content)');
        return {
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          actions: [],
          schedules: [],
          createdAt: new Date().toISOString()
        };
      }

      const parsed = JSON.parse(content);
      
      // Validate that the parsed content looks like agent data
      if (typeof parsed === 'object' && parsed !== null) {
        // Ensure arrays exist and are actually arrays
        const models = Array.isArray(parsed.models) ? parsed.models : [];
        const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
        const schedules = Array.isArray(parsed.schedules) ? parsed.schedules : [];
        
        const initialData = {
          name: typeof parsed.name === 'string' ? parsed.name : 'New Agent',
          description: typeof parsed.description === 'string' ? parsed.description : '',
          domain: typeof parsed.domain === 'string' ? parsed.domain : '',
          models,
          actions,
          schedules,
          createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString()
        };

        console.log('📥 Initialized agent data from content:', {
          name: initialData.name,
          modelCount: initialData.models.length,
          actionCount: initialData.actions.length
        });

        return initialData;
      } else {
        console.warn('⚠️ Parsed content is not an object, using defaults');
        return {
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          actions: [],
          schedules: [],
          createdAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse initial content, using defaults. Error:', (e as Error).message);
      console.warn('📄 Problematic content (first 200 chars):', content ? content.substring(0, 200) : 'none');
      return {
        name: 'New Agent',
        description: '',
        domain: '',
        models: [],
        actions: [],
        schedules: [],
        createdAt: new Date().toISOString()
      };
    }
  });

  // Update metadata safely - moved before other callbacks to maintain hook order
  const updateMetadata = useCallback((updates: Partial<AgentArtifactMetadata>) => {
    if (setMetadata) {
      setMetadata({ ...safeMetadata, ...updates });
    }
  }, [safeMetadata, setMetadata]);

  // Update content when agent data changes - moved to maintain hook order
  const updateAgentData = useCallback((newData: AgentData) => {
    setAgentData(newData);
    const jsonContent = JSON.stringify(newData, null, 2);
    // Save without debouncing to ensure document versions are created for navigation
    // This allows the back/forward version navigation to work properly
    onSaveContent(jsonContent, false);
  }, [onSaveContent]);

  // Enhanced save function - moved to maintain consistent hook order
  const saveAgentToConversation = useCallback(async () => {
    // Save the current agent data using the standard document saving mechanism
    const agentContent = JSON.stringify(agentData, null, 2);
    onSaveContent(agentContent, false);
    
    console.log('✅ Agent data saved through standard document mechanism');
  }, [agentData, onSaveContent]);

  // Monitor content changes from external sources (like when opening from chat or refreshing page)
  useEffect(() => {
    // Skip if content is explicitly empty or just whitespace
    if (!content || content.trim() === '') {
      return;
    }

    // Debug logging to track content updates
    console.log('🔍 Agent builder received content update:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      currentAgentName: agentData.name,
      currentModelCount: agentData.models.length
    });

    try {
      const parsed = JSON.parse(content);
      
      // Check if this is meaningful agent data (not just empty default structure)
      const hasRealData = (parsed.name && parsed.name !== 'New Agent' && parsed.name.trim() !== '') ||
                         (parsed.description && parsed.description.trim() !== '') ||
                         (parsed.domain && parsed.domain.trim() !== '') ||
                         (parsed.models && parsed.models.length > 0) ||
                         (parsed.actions && parsed.actions.length > 0);

      // Always update if we have real data, or if current state is just defaults
      const currentIsDefaults = agentData.name === 'New Agent' && 
                               !agentData.description && 
                               !agentData.domain &&
                               agentData.models.length === 0 && 
                               agentData.actions.length === 0;

      // Also update if content is not empty JSON object and we have defaults
      const isEmptyJsonObject = content.trim() === '{}';
      
      if (hasRealData || (currentIsDefaults && !isEmptyJsonObject)) {
        const updatedData = {
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models: parsed.models || [],
          actions: parsed.actions || [],
          schedules: parsed.schedules || [],
          createdAt: parsed.createdAt || new Date().toISOString()
        };
        
        // Only update if the content is actually different
        const currentDataString = JSON.stringify(agentData);
        const newDataString = JSON.stringify(updatedData);
        
        if (currentDataString !== newDataString) {
          console.log('📥 Updating agent data from fetched content:', {
            hasRealData,
            currentIsDefaults,
            isEmptyJsonObject,
            newName: updatedData.name,
            modelCount: updatedData.models.length,
            actionCount: updatedData.actions.length
          });
          
          setAgentData(updatedData);
        }
      } else {
        console.log('🔄 Skipping update - no real data and not replacing defaults:', {
          hasRealData,
          currentIsDefaults,
          isEmptyJsonObject
        });
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse updated content:', e);
    }
  }, [content]); // Only depend on content, not agentData to avoid loops

  if (isLoading) {
    return <DocumentSkeleton artifactKind="agent" />;
  }

  if (mode === 'diff') {
    const oldContent = getDocumentContentById(currentVersionIndex - 1);
    const newContent = getDocumentContentById(currentVersionIndex);
    return <DiffView oldContent={oldContent} newContent={newContent} />;
  }

  const addModel = () => {
    const newModel: AgentModel = {
      id: generateNewId('model', agentData.models || []),
      name: `Model${(agentData.models?.length || 0) + 1}`,
      emoji: '🗃️', // Default emoji, will be auto-generated by AI
      idField: 'id',
      displayFields: [],
      fields: [
        {
          id: 'fld1',
          name: 'id',
          type: 'String',
          isId: true,
          unique: true,
          list: false,
          required: true,
          kind: 'scalar',
          relationField: false,
          title: 'ID',
          sort: false,
          order: 1
        },
        {
          id: 'fld2',
          name: 'published',
          type: 'Boolean',
          isId: false,
          unique: false,
          list: false,
          required: false,
          kind: 'scalar',
          relationField: false,
          title: 'Published',
          sort: false,
          order: 2,
          defaultValue: 'false'
        }
      ],
      enums: [],
      hasPublishedField: true
    };
    
    // Add to top of list and set to editing mode
    updateAgentData({
      ...agentData,
      models: [newModel, ...(agentData.models || [])]
    });
    updateMetadata({ editingModel: newModel.id });
  };

  const addSchedule = () => {
    const newSchedule: AgentSchedule = {
      id: generateNewId('schedule', agentData.schedules || []),
      name: `Schedule${(agentData.schedules?.length || 0) + 1}`,
      emoji: '⏰', // Default emoji, will be auto-generated by AI
      description: '',
      type: 'Create',
      role: 'admin',
      interval: {
        pattern: '0 0 * * *',
        timezone: 'UTC',
        active: true
      },
      dataSource: {
        type: 'database',
        database: { models: [] }
      },
      execute: {
        type: 'code',
        code: { script: '' }
      },
      results: {
        actionType: 'Create',
        model: ''
      }
    };
    
    // Add to top of list and set to editing mode
    updateAgentData({
      ...agentData,
      schedules: [newSchedule, ...(agentData.schedules || [])]
    });
    updateMetadata({ editingSchedule: newSchedule.id });
  };

  const addAction = () => {
    const newAction: AgentAction = {
      id: generateNewId('action', agentData.actions || []),
      name: `Action${(agentData.actions?.length || 0) + 1}`,
      emoji: '⚡', // Default emoji, will be auto-generated by AI
      description: '',
      type: 'Create',
      role: 'admin',
      dataSource: {
        type: 'database',
        database: { models: [] }
      },
      execute: {
        type: 'code',
        code: { script: '' }
      },
      results: {
        actionType: 'Create',
        model: ''
      }
    };
    
    // Add to top of list and set to editing mode
    const updatedActions = [newAction, ...(agentData.actions || [])];
    updateAgentData({
      ...agentData,
      actions: updatedActions
    });
    updateMetadata({ editingAction: newAction.id }); // Use actual action ID instead of '0'
  };

  // Tab configuration
  const tabs = [
    {
      id: 'models' as const,
      label: 'Models',
      count: agentData.models?.length || 0
    },
    {
      id: 'actions' as const,
      label: 'Actions',
      count: agentData.actions?.length || 0
    },
    {
      id: 'schedules' as const,
      label: 'Schedules',
      count: agentData.schedules?.length || 0
    }
  ];

  return (
    <div className="h-full bg-black text-green-200 flex flex-col relative overflow-hidden font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <div className="text-black text-lg">🤖</div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-matrix-gradient bg-clip-text font-mono">
                    Agent Builder
                  </h1>
                  <p className="text-green-400 text-xs sm:text-sm font-medium font-mono">
                    Design and configure your AI agent system
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-xl bg-black/50 border border-green-500/20 backdrop-blur-sm">
                <div className="status-indicator status-online">
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    status === 'streaming'
                      ? "bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"
                      : "bg-green-400 animate-matrix-pulse shadow-lg shadow-green-400/50"
                  )} />
                </div>
                <span className="text-sm font-medium text-green-400 font-mono">
                  {status === 'streaming' ? 'Building...' : 'Ready'}
                </span>
              </div>
              
              {/* Save Button */}
              <Button
                onClick={saveAgentToConversation}
                className="btn-matrix px-4 sm:px-6 py-2.5 text-sm font-medium font-mono"
              >
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4">💾</div>
                  <span>Save Agent</span>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Enhanced Progress Indicator - Only show when AI is actually running */}
          {status === 'streaming' && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-2xl bg-black/50 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="text-sm font-medium text-green-200 font-mono">Build Progress</div>
                  <div className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium font-mono border border-green-500/30 self-start">
                    {agentData?.name || 'AI Agent System'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData))}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/30"
                  style={{ width: `${calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData)}%` }}
                />
                {/* Animated shimmer effect for active progress */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              {/* Progress Steps */}
              {/* <div className="flex justify-between mt-4 text-xs font-mono">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'models', label: 'Models' },
                  { id: 'enums', label: 'Enums' },
                  { id: 'actions', label: 'Actions' },
                  { id: 'schedules', label: 'Schedules' }
                ].map((step) => {
                  const stepStatus = getStepStatus(step.id, safeMetadata.currentStep, safeMetadata.stepProgress, agentData);
                  const isComplete = stepStatus === 'complete';
                  const isProcessing = stepStatus === 'processing';
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isComplete 
                          ? 'bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow' 
                          : isProcessing 
                          ? 'bg-yellow-400 shadow-lg shadow-yellow-500/50 animate-pulse'
                          : 'bg-green-500/20 border border-green-500/30'
                      }`} />
                      <span className={`font-medium transition-colors duration-300 ${
                        isComplete 
                          ? 'text-green-400' 
                          : isProcessing 
                          ? 'text-yellow-400'
                          : 'text-green-500/50'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div> */}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateMetadata({ 
                  selectedTab: tab.id,
                  dataManagement: null // Clear dataManagement when switching tabs
                })}
                className={cn(
                  "relative px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium font-mono transition-all duration-300 border-b-2 group whitespace-nowrap flex-shrink-0",
                  safeMetadata.selectedTab === tab.id
                    ? "text-green-300 border-green-400 bg-green-500/10"
                    : "text-green-500 border-transparent hover:text-green-300 hover:bg-green-500/5"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-medium">{tab.label}</span>
                  <div className={cn(
                    "px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold font-mono transition-colors border",
                    safeMetadata.selectedTab === tab.id
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-green-500/10 text-green-400 border-green-500/20 group-hover:bg-green-500/20 group-hover:text-green-300"
                  )}>
                    {tab.count}
                  </div>
                </div>
                
                {/* Active tab indicator */}
                {safeMetadata.selectedTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-t-lg -z-10" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {(() => {
              console.log('🔍 Render - dataManagement:', safeMetadata.dataManagement);
              
              // Check if we should show ModelDataViewer
              const viewingModelId = safeMetadata.dataManagement?.viewingModelId;
              if (viewingModelId) {
                const viewingModel = (agentData.models || []).find(m => m.id === viewingModelId);
                
                if (viewingModel) {
                  console.log('✅ Rendering ModelDataViewer for model:', viewingModel.name);
                  return (
                    <ModelDataViewer
                      key={viewingModel.id}
                      model={viewingModel}
                      allModels={agentData.models || []}
                      onUpdateModel={(updatedModel) => {
                        console.log('🔄 Updating model:', updatedModel);
                        const updatedModels = (agentData.models || []).map(m => 
                          m.id === updatedModel.id ? updatedModel : m
                        );
                              updateAgentData({ ...agentData, models: updatedModels });
                            }}
                      onBack={() => {
                        console.log('🔙 Going back from ModelDataViewer');
                        updateMetadata({ dataManagement: null });
                      }}
                    />
                  );
                } else {
                  console.log('❌ No model found for viewingModelId:', viewingModelId);
                }
              }
              
              // Show appropriate tab content
              if (safeMetadata.selectedTab === 'models') {
                return (
                  <ModelsListEditor
                    models={agentData.models || []}
                    onModelsChange={(models) => updateAgentData({ ...agentData, models })}
                    updateMetadata={updateMetadata}
                    status={status}
                  />
                );
              }
              
              if (safeMetadata.selectedTab === 'actions') {
                console.log('⚡ Rendering ActionsListEditor');
                return (
                  <ActionsListEditor
                    actions={agentData.actions || []}
                    updateActions={(actions) => updateAgentData({ ...agentData, actions })}
                    editingId={safeMetadata.editingAction}
                    setEditingId={(id) => updateMetadata({ editingAction: id })}
                    addAction={addAction}
                    models={agentData.models || []}
                    status={status}
                  />
                );
              }
              
              if (safeMetadata.selectedTab === 'schedules') {
                console.log('⏰ Rendering SchedulesListEditor');
                return (
                  <SchedulesListEditor
                    schedules={agentData.schedules || []}
                    updateSchedules={(schedules) => updateAgentData({ ...agentData, schedules })}
                    editingId={safeMetadata.editingSchedule}
                    setEditingId={(id) => updateMetadata({ editingSchedule: id })}
                    addSchedule={addSchedule}
                    models={agentData.models || []}
                    status={status}
                  />
                );
              }
              
              console.log('❓ No matching tab or condition');
              return null;
            })()}
                                </div>
                                  </div>
      </div>
    </div>
  );
});

export const agentArtifact = new Artifact<'agent', AgentArtifactMetadata>({
  kind: 'agent',
  description: 'AI Agent Builder for creating database-driven automation systems',
  
  initialize: ({ setMetadata }) => {
    setMetadata({
      selectedTab: 'models',
      editingModel: null,
      editingAction: null,
      editingSchedule: null,
      viewingModelData: null,
      editingRecord: null,
      dataManagement: null
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
        
      setMetadata((draftMetadata) => {
        const newMetadata: AgentArtifactMetadata = {
          ...(draftMetadata || {}),
          selectedTab: draftMetadata?.selectedTab || 'models',
          editingModel: draftMetadata?.editingModel || null,
          editingAction: draftMetadata?.editingAction || null,
          editingSchedule: draftMetadata?.editingSchedule || null,
          currentStep: stepData.step,
          stepProgress: {
            ...(draftMetadata?.stepProgress || {}),
            [stepData.step]: stepData.status
          },
          stepMessages: {
            ...(draftMetadata?.stepMessages || {}),
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
    }
    
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + (streamPart.content as string),
        isVisible: draftArtifact.status === 'streaming' && draftArtifact.content.length > 200,
        status: 'streaming',
      }));
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