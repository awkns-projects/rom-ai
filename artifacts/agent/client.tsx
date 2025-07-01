import * as React from 'react';
import { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { DiffView } from '@/components/diffview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { generateNewId, calculateProgressPercentage } from './utils';
import { ModelsListEditor } from './components/lists/ModelsListEditor';
import { ActionsListEditor } from './components/lists/ActionsListEditor';
import { SchedulesListEditor } from './components/lists/SchedulesListEditor';
import { OnboardContent } from './components/OnboardContent';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

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

  // Collect all enums from all models
  const allEnums = useMemo(() => {
    return allModels.flatMap(model => model.enums || []);
  }, [allModels]);

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
        allEnums={allEnums}
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
  allModels = [],
  allEnums = []
}: { 
  model: AgentModel;
  record?: ModelRecord | null;
  onSave: (data: Record<string, any>, recordId?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
  allModels?: AgentModel[];
  allEnums?: AgentEnum[];
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
            value={selectedId || 'none'}
            onValueChange={(value) => updateField(field.name, value === 'none' ? null : value)}
          >
            <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
              <SelectValue placeholder={`Select ${field.type}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="none" className="text-green-200 focus:bg-green-500/20 font-mono">
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
    
    // Handle enum fields
    if (field.kind === 'enum') {
      const enumType = allEnums.find(e => e.name === field.type);
      
      if (!enumType) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-sm font-mono">
              Enum "{field.type}" not found
            </span>
          </div>
        );
      }

      const enumValues = enumType.fields || [];
      
      if (enumValues.length === 0) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm font-mono">
              No values defined for enum "{field.type}"
            </span>
          </div>
        );
      }

      if (field.list) {
        // Multi-select for list enums
        const selectedValues = Array.isArray(getFieldValue(field)) ? getFieldValue(field) : [];
        
        return (
          <div className="space-y-2">
            <div className="text-green-400 text-xs font-mono mb-2">
              Select multiple values ({selectedValues.length} selected)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-black/30 border border-green-500/20">
              {enumValues.map(enumValue => {
                const isSelected = selectedValues.includes(enumValue.name);
                
                return (
                  <label key={enumValue.id} className="flex items-center gap-2 p-2 hover:bg-green-500/10 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelectedValues = e.target.checked
                          ? [...selectedValues, enumValue.name]
                          : selectedValues.filter((value: string) => value !== enumValue.name);
                        updateField(field.name, newSelectedValues);
                      }}
                      className="w-4 h-4 rounded border-green-500/30 bg-black/50 text-green-400 focus:ring-green-400/20"
                    />
                    <span className="text-green-200 text-sm font-mono flex-1">
                      {enumValue.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      } else {
        // Single select for non-list enums
        const selectedValue = getFieldValue(field);
        
        return (
          <Select
            value={selectedValue || 'none'}
            onValueChange={(value) => updateField(field.name, value === 'none' ? '' : value)}
          >
            <SelectTrigger className="bg-black/50 border-green-500/30 text-green-200 focus:border-green-400 focus:ring-green-400/20 font-mono">
              <SelectValue placeholder={`Select ${field.type}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-500/30">
              <SelectItem value="none" className="text-green-200 focus:bg-green-500/20 font-mono">
                None selected
              </SelectItem>
              {enumValues.map(enumValue => (
                <SelectItem 
                  key={enumValue.id} 
                  value={enumValue.name} 
                  className="text-green-200 focus:bg-green-500/20 font-mono"
                >
                  {enumValue.name}
                </SelectItem>
              ))}
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
  const documentId = artifact?.documentId; // Get documentId from artifact
  const router = useRouter();
  const params = useParams();
  
  // Get chatId from router query parameters
  const chatId = params.id as string;
  
  // Initialize metadata with defaults if null
  const safeMetadata: AgentArtifactMetadata = metadata || {
    selectedTab: 'onboard',
    editingModel: null,
    editingAction: null,
    editingSchedule: null,
    viewingModelData: null,
    editingRecord: null,
    dataManagement: null,
    showExplanationModal: null
  };

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

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
          id: parsed.id, // Keep id if it exists (from orchestrator)
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models,
          actions,
          schedules,
          createdAt: parsed.createdAt || new Date().toISOString(),
          metadata: parsed.metadata // Keep metadata if it exists (from orchestrator)
        };

        console.log('📥 Initialized agent data from content:', {
          id: initialData.id,
          name: initialData.name,
          modelCount: initialData.models.length,
          actionCount: initialData.actions.length,
          hasMetadata: !!initialData.metadata
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
    console.log('🔄 updateAgentData called with:', {
      currentModels: agentData.models?.length || 0,
      currentActions: agentData.actions?.length || 0,
      currentSchedules: agentData.schedules?.length || 0,
      newModels: newData.models?.length || 0,
      newActions: newData.actions?.length || 0,
      newSchedules: newData.schedules?.length || 0,
      currentModelNames: (agentData.models || []).map((m: AgentModel) => m.name),
      newModelNames: (newData.models || []).map((m: AgentModel) => m.name),
      currentActionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
      newActionNames: (newData.actions || []).map((a: AgentAction) => a.name),
      currentScheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name),
      newScheduleNames: (newData.schedules || []).map((s: AgentSchedule) => s.name)
    });
    
    setAgentData(newData);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    // Removed auto-save - only save when user explicitly clicks "Save Agent"
    // const serializedData = JSON.stringify(newData, null, 2);
    // onSaveContent(serializedData, true);
  }, [agentData.models, agentData.actions, agentData.schedules]);

  // Enhanced save function - moved to maintain consistent hook order
  const saveAgentToConversation = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save the current agent data using the standard document saving mechanism
      const agentContent = JSON.stringify(agentData, null, 2);
      onSaveContent(agentContent, false);
      
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      console.log('✅ Agent data saved through standard document mechanism');
      
      // Show deployment modal after successful save
      setShowDeploymentModal(true);
    } catch (error) {
      console.error('❌ Failed to save agent data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [agentData, onSaveContent]);

  // Monitor content changes from external sources (like when opening from chat or refreshing page)
  useEffect(() => {
    // Skip if content is explicitly empty or just whitespace
    if (!content || content.trim() === '') {
      return;
    }

    try {
      const parsed = JSON.parse(content);
      
      // Check if this is meaningful agent data (not just empty default structure)
      const hasRealData = (parsed.name && parsed.name !== 'New Agent' && parsed.name.trim() !== '') ||
                         (parsed.description && parsed.description.trim() !== '') ||
                         (parsed.domain && parsed.domain.trim() !== '') ||
                         (parsed.models && parsed.models.length > 0) ||
                         (parsed.actions && parsed.actions.length > 0) ||
                         (parsed.schedules && parsed.schedules.length > 0);

      // Only update if we have real data
      if (hasRealData) {
        const updatedData = {
          id: parsed.id, // Keep id if it exists (from orchestrator)
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models: Array.isArray(parsed.models) ? parsed.models : [],
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
          createdAt: parsed.createdAt || new Date().toISOString(),
          metadata: parsed.metadata // Keep metadata if it exists (from orchestrator)
        };
        
        // Only update if data has actually changed
        const currentDataString = JSON.stringify({
          name: agentData.name,
          description: agentData.description,
          domain: agentData.domain,
          models: agentData.models,
          actions: agentData.actions,
          schedules: agentData.schedules
        });
        const newDataString = JSON.stringify(updatedData);
        
        if (currentDataString !== newDataString) {
          setAgentData(updatedData);
        }
      }
    } catch (e) {
      console.warn('Failed to parse updated content:', e);
    }
  }, [content]); // Remove updateMetadata and agentData from dependencies to prevent loops


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
        active: false
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
      role: 'admin',
      dataSource: {
        type: 'database',
        database: {
          models: []
        }
      },
      execute: {
        type: 'code',
        code: {
          script: '',
          envVars: []
        }
      },
      results: {
        actionType: 'Create',
        model: '',
        fields: {}
      },
      uiComponents: {
        stepForms: [],
        resultView: {
          title: 'Action Results',
          description: 'View the results of the action execution',
          reactCode: '',
          propsInterface: {}
        }
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
      id: 'onboard' as const,
      label: 'Onboard',
      count: 0
    },
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

  // Debug logging for tab counts
  console.log('📊 Tab counts:', {
    models: agentData.models?.length || 0,
    actions: agentData.actions?.length || 0,
    schedules: agentData.schedules?.length || 0,
    modelNames: (agentData.models || []).map((m: AgentModel) => m.name),
    actionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
    scheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name)
  });

  // Add explanation modal handlers
  const openExplanationModal = useCallback((type: 'models' | 'actions' | 'schedules') => {
    setMetadata({ ...safeMetadata, showExplanationModal: type });
  }, [safeMetadata]);

  const closeExplanationModal = useCallback(() => {
    setMetadata({ ...safeMetadata, showExplanationModal: null });
  }, [safeMetadata]);

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
            
            <div className="flex flex-row items-center justify-between sm:justify-start gap-3 sm:gap-4">
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
                disabled={isSaving}
                className={cn(
                  "px-4 sm:px-6 py-2.5 text-sm font-medium font-mono transition-all duration-200",
                  hasUnsavedChanges 
                    ? "btn-matrix border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300" 
                    : "btn-matrix"
                )}
              >
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4">
                    {isSaving ? '⏳' : hasUnsavedChanges ? '📝' : '💾'}
                  </div>
                  <span>
                    {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Agent'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Enhanced Progress Indicator - Only show when AI is actually running */}
          {status === 'streaming' && (
            <div className="mt-3 sm:mt-6 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-black/50 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="text-xs sm:text-sm font-medium text-green-200 font-mono">Build Progress</div>
                  <div className="px-2 py-0.5 sm:py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium font-mono border border-green-500/30 self-start">
                    {agentData?.name || 'AI Agent System'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{Math.round(calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData))}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-1.5 sm:h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/30"
                  style={{ width: `${calculateProgressPercentage(safeMetadata.currentStep, safeMetadata.stepProgress, agentData)}%` }}
                />
                {/* Animated shimmer effect for active progress */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              {/* Progress Steps */}
               <div className="flex justify-center mt-2 sm:mt-4 text-xs font-mono">
                {(() => {
                  const steps = [
                    { id: 'prompt-understanding', label: 'Analysis' },
                    { id: 'overview', label: 'Overview' },
                    { id: 'models', label: 'Models' },
                    { id: 'actions', label: 'Actions' },
                    { id: 'schedules', label: 'Schedules' },
                    { id: 'complete', label: 'Complete' }
                  ];
                  
                  // Use the enhanced step status function to properly handle API sync
                  const getEnhancedStepStatus = (stepId: string) => {
                    // Map orchestrator step IDs to UI step IDs
                    const stepIdMapping: Record<string, string> = {
                      'step0': 'prompt-understanding',
                      'step1': 'analysis',
                      'step2': 'overview',
                      'step3': 'models',
                      'step4': 'actions',
                      'step5': 'schedules',
                      'complete': 'complete'
                    };
                    
                    // Check both the UI step ID and orchestrator step ID
                    const orchestratorStepId = Object.keys(stepIdMapping).find(key => stepIdMapping[key] === stepId) || stepId;
                    const uiStepId = stepIdMapping[stepId] || stepId;
                    
                    // Check stepProgress for both IDs
                    if (safeMetadata.stepProgress) {
                      if (safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[stepId as keyof typeof safeMetadata.stepProgress];
                      }
                      if (orchestratorStepId && safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[orchestratorStepId as keyof typeof safeMetadata.stepProgress];
                      }
                      if (uiStepId && safeMetadata.stepProgress[uiStepId as keyof typeof safeMetadata.stepProgress]) {
                        return safeMetadata.stepProgress[uiStepId as keyof typeof safeMetadata.stepProgress];
                      }
                    }
                    
                    // Check if this is the current step
                    if (safeMetadata.currentStep === stepId || safeMetadata.currentStep === orchestratorStepId || safeMetadata.currentStep === uiStepId) {
                      return 'processing';
                    }
                    
                    // Use the existing getStepStatus function as fallback
                    return getStepStatus(stepId, safeMetadata.currentStep, safeMetadata.stepProgress, agentData);
                  };
                  
                  // Find the current step
                  const currentStep = steps.find(step => {
                    const stepStatus = getEnhancedStepStatus(step.id);
                    return stepStatus === 'processing';
                  }) || steps.find(step => step.id === 'complete');
                  
                  if (!currentStep) return null;
                  
                  const stepStatus = getEnhancedStepStatus(currentStep.id);
                  const isComplete = stepStatus === 'complete';
                  const isProcessing = stepStatus === 'processing';
                  
                  return (
                    <div className="flex items-center gap-2">
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
                        {currentStep.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50 sticky top-0 z-50 md:static md:z-auto">
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
                  {tab.id !== 'onboard' && (
                    <div className={cn(
                      "px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-bold font-mono transition-colors border",
                      safeMetadata.selectedTab === tab.id
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-green-500/10 text-green-400 border-green-500/20 group-hover:bg-green-500/20 group-hover:text-green-300"
                    )}>
                      {tab.count}
                    </div>
                  )}
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
                        const updatedModels = (agentData.models || []).map((m: AgentModel) => 
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
              if (safeMetadata.selectedTab === 'onboard') {
                return (
                  <OnboardContent 
                    onTabChange={(tab) => setMetadata({ 
                      ...safeMetadata, 
                      selectedTab: tab 
                    })} 
                  />
                );
              }
              
              if (safeMetadata.selectedTab === 'models') {
                console.log('🗂️ Rendering ModelsListEditor');
                console.log('🗂️ Models data:', {
                  modelsCount: agentData.models?.length || 0,
                  modelNames: (agentData.models || []).map((m: AgentModel) => m.name),
                  editingId: safeMetadata.editingModel
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                              <span className="text-lg">🗃️</span>
                            </div>
                            <h2 className="text-xl font-bold text-blue-200 font-mono">Data Models</h2>
                          </div>
                          <p className="text-blue-300 text-sm font-mono leading-relaxed mb-3">
                            Define the structure of your data with custom models. Each model represents a table in your database with fields, types, and relationships. Models store and organize all the information your agent will work with.
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-mono">
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">📊 Database Tables</span>
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">🔗 Relationships</span>
                            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">✅ Validation</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => openExplanationModal('models')}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-base"
                        >
                          <span>📖</span>
                          <span>How Models Work</span>
                        </Button>
                      </div>
                    </div>
                    
                    <ModelsListEditor
                      models={agentData.models || []}
                      onModelsChange={(models) => updateAgentData({ ...agentData, models })}
                      updateMetadata={(updates) => {
                        setMetadata({ 
                          ...safeMetadata, 
                          ...updates
                        });
                      }}
                      status={'idle'}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'actions') {
                console.log('⚡ Rendering ActionsListEditor');
                console.log('⚡ Actions data:', {
                  actionsCount: agentData.actions?.length || 0,
                  actionNames: (agentData.actions || []).map((a: AgentAction) => a.name),
                  editingId: safeMetadata.editingAction
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                              <span className="text-lg">⚡</span>
                            </div>
                            <h2 className="text-xl font-bold text-purple-200 font-mono">Actions</h2>
                          </div>
                          <p className="text-purple-300 text-sm font-mono leading-relaxed mb-3">
                            Create interactive actions that users can trigger to manipulate data. Actions can collect user input, process information, and create or update records in your models. Perfect for forms, workflows, and user interactions.
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-mono">
                            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🎯 User Triggered</span>
                            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">📝 Data Input</span>
                            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">🔄 Processing</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => openExplanationModal('actions')}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-base"
                        >
                          <span>⚡</span>
                          <span>How Actions Work</span>
                        </Button>
                      </div>
                    </div>

                    <ActionsListEditor
                      actions={agentData.actions || []}
                      onUpdate={(actions) => updateAgentData({ ...agentData, actions })}
                      allModels={agentData.models || []}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              if (safeMetadata.selectedTab === 'schedules') {
                console.log('⏰ Rendering SchedulesListEditor');
                console.log('⏰ Schedules data:', {
                  schedulesCount: agentData.schedules?.length || 0,
                  scheduleNames: (agentData.schedules || []).map((s: AgentSchedule) => s.name),
                  editingId: safeMetadata.editingSchedule
                });
                return (
                  <div className="space-y-6">
                    {/* Introduction Section */}
                    <div className="p-4 sm:p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                              <span className="text-lg">⏰</span>
                            </div>
                            <h2 className="text-xl font-bold text-orange-200 font-mono">Schedules</h2>
                          </div>
                          <p className="text-orange-300 text-sm font-mono leading-relaxed mb-3">
                            Automate recurring tasks with scheduled actions that run at specific intervals. Perfect for data syncing, regular maintenance, reports, or any automated workflow that needs to happen on a timer.
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-mono">
                            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🤖 Automated</span>
                            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">⏱️ Time-based</span>
                            <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🔄 Recurring</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => openExplanationModal('schedules')}
                          variant="outline"
                          className="btn-matrix border-orange-500/30 hover:border-orange-500/50 text-orange-200 hover:text-orange-100 bg-transparent hover:bg-orange-500/10 px-4 py-2 text-sm whitespace-nowrap"
                        >
                          Explain More
                        </Button>
                      </div>
                    </div>

                    <SchedulesListEditor
                      schedules={agentData.schedules || []}
                      onUpdate={(schedules) => updateAgentData({ ...agentData, schedules })}
                      allModels={agentData.models || []}
                      documentId={documentId}
                    />
                  </div>
                );
              }
              
              console.log('❓ No matching tab or condition');
              return null;
            })()}
                                </div>
                                  </div>
      </div>
      
      {/* Deployment Modal */}
      <Dialog open={showDeploymentModal} onOpenChange={setShowDeploymentModal}>
        <DialogContent className="sm:max-w-[425px] bg-black/95 border-green-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-green-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-black text-lg">🚀</span>
              </div>
              Agent Saved Successfully!
            </DialogTitle>
            <DialogDescription className="text-green-400 font-mono">
              Your agent "<span className="text-green-200 font-semibold">{agentData.name}</span>" has been saved. 
              Would you like to proceed to the deployment page to make it live?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 mt-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                <span className="text-green-200 font-medium font-mono">What happens next?</span>
              </div>
              <ul className="text-sm text-green-400 font-mono space-y-1 ml-4">
                <li>• Configure deployment environment</li>
                <li>• Set up database connections</li>
                <li>• Deploy agent to production</li>
                <li>• Monitor and manage your agent</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeploymentModal(false)}
              className="btn-matrix border-green-500/30 hover:border-green-500/50 text-white hover:text-green-200 bg-transparent hover:bg-green-500/10"
            >
              <span className="font-mono">Maybe Later</span>
            </Button>
            <Button
              onClick={() => {
                setShowDeploymentModal(false);
                // Navigate to deployment page with chatId
                const deploymentUrl = chatId 
                  ? `/deployment?chatId=${chatId}`
                  : '/deployment';
                router.push(deploymentUrl);
              }}
              className="btn-matrix bg-green-600 hover:bg-green-700 text-black font-bold"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono">Deploy Agent</span>
                <span>🚀</span>
              </div>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Explanation Modals */}
      {/* Models Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'models'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-blue-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-lg">🗃️</span>
              </div>
              Data Models Explained
            </DialogTitle>
            <DialogDescription className="text-blue-400 font-mono">
              Learn how to structure and organize your data with powerful models
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Models */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-blue-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-blue-400">📊</span> What are Data Models?
              </h3>
              <p className="text-blue-300 text-sm font-mono leading-relaxed mb-3">
                Data models define the structure of information in your agent. Think of them as blueprints for database tables that specify what fields exist, their types, and how they relate to each other.
              </p>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="text-xs font-mono text-blue-400 mb-2">Example Model: "User"</div>
                <div className="space-y-1 text-xs font-mono text-blue-300">
                  <div className="flex justify-between"><span>📝 name</span><span>String (required)</span></div>
                  <div className="flex justify-between"><span>📧 email</span><span>String (unique)</span></div>
                  <div className="flex justify-between"><span>🎂 age</span><span>Integer</span></div>
                  <div className="flex justify-between"><span>✅ published</span><span>Boolean</span></div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">🔗</span> Relationships
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Connect models together. A "Post" can belong to a "User", creating powerful data relationships.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">✅</span> Validation
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Set required fields, unique constraints, and default values to ensure data integrity.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">🎨</span> Custom Forms
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  Group fields into forms for better user experience when creating or editing records.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-blue-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-blue-400">📊</span> Data Management
                </h4>
                <p className="text-blue-300 text-xs font-mono leading-relaxed">
                  View, edit, and manage actual records stored in your models with built-in interfaces.
                </p>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-blue-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-blue-400">🎯</span> Example: Blog System
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="text-sm font-mono text-blue-200 mb-2">📝 Post Model</div>
                  <div className="space-y-1 text-xs font-mono text-blue-300">
                    <div>• title (String, required)</div>
                    <div>• content (Text)</div>
                    <div>• published (Boolean)</div>
                    <div>• author → User</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="text-sm font-mono text-blue-200 mb-2">👤 User Model</div>
                  <div className="space-y-1 text-xs font-mono text-blue-300">
                    <div>• name (String, required)</div>
                    <div>• email (String, unique)</div>
                    <div>• role (Enum: admin/user)</div>
                    <div>• posts ← Post[]</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'actions'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-purple-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-purple-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <span className="text-lg">⚡</span>
              </div>
              Actions Explained
            </DialogTitle>
            <DialogDescription className="text-purple-400 font-mono">
              Create powerful user-triggered workflows and data processing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Actions */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-purple-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-purple-400">⚡</span> What are Actions?
              </h3>
              <p className="text-purple-300 text-sm font-mono leading-relaxed mb-3">
                Actions are interactive workflows that users can trigger to process data. They collect input from users, execute custom logic, and create or update records in your models.
              </p>
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="text-xs font-mono text-purple-400 mb-2">Action Flow:</div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-300 flex-wrap">
                  <span className="px-2 py-1 rounded bg-purple-500/20">📥 User Input</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/20">🔄 Processing</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-purple-500/20">💾 Database Update</span>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">📝</span> Input Forms
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Collect data from users with custom forms that validate input and provide great UX.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🤖</span> AI Processing
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Use AI prompts to analyze, transform, or enhance user input before saving to models.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🔧</span> Custom Code
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Write custom JavaScript to handle complex business logic and data transformations.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <h4 className="text-purple-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🎯</span> Role-based
                </h4>
                <p className="text-purple-300 text-xs font-mono leading-relaxed">
                  Control who can trigger actions with admin or member role permissions.
                </p>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-purple-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-purple-400">🎯</span> Example: "Create Blog Post"
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 1: Collect Input</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-purple-300">
                    <div>• Title (required)</div>
                    <div>• Content (required)</div>
                    <div>• Category (dropdown)</div>
                    <div>• Tags (multi-select)</div>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 2: AI Enhancement</div>
                  <div className="text-xs font-mono text-purple-300">
                    "Generate SEO-friendly slug and meta description from the title and content"
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="text-sm font-mono text-purple-200 mb-2">Step 3: Save to Model</div>
                  <div className="text-xs font-mono text-purple-300">
                    Create new Post record with processed data + current user as author
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedules Explanation Modal */}
      <Dialog open={safeMetadata.showExplanationModal === 'schedules'} onOpenChange={closeExplanationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-orange-500/20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-orange-200 font-mono text-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                <span className="text-lg">⏰</span>
              </div>
              Schedules Explained
            </DialogTitle>
            <DialogDescription className="text-orange-400 font-mono">
              Automate recurring tasks and workflows with intelligent scheduling
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* What are Schedules */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">⏰</span> What are Schedules?
              </h3>
              <p className="text-orange-300 text-sm font-mono leading-relaxed mb-3">
                Schedules automate tasks that need to run regularly without user intervention. Perfect for data syncing, maintenance, reports, or any workflow that should happen on a timer.
              </p>
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <div className="text-xs font-mono text-orange-400 mb-2">Schedule Flow:</div>
                <div className="flex items-center gap-2 text-xs font-mono text-orange-300 flex-wrap">
                  <span className="px-2 py-1 rounded bg-orange-500/20">⏱️ Timer Triggers</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-orange-500/20">🔄 Execute Code</span>
                  <span>→</span>
                  <span className="px-2 py-1 rounded bg-orange-500/20">💾 Update Data</span>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">📅</span> Flexible Timing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Run every minute, hour, day, week, or with custom cron expressions for precise timing.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🤖</span> AI Processing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Use AI to analyze data, generate content, or make decisions during scheduled runs.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🔄</span> Data Sync
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Automatically sync with external APIs, update records, or perform maintenance tasks.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <h4 className="text-orange-200 font-semibold font-mono mb-2 flex items-center gap-2">
                  <span className="text-orange-400">🛡️</span> Safe Testing
                </h4>
                <p className="text-orange-300 text-xs font-mono leading-relaxed">
                  Test schedules safely without affecting real data before activating them.
                </p>
              </div>
            </div>

            {/* Timing Examples */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">⏱️</span> Common Schedule Patterns
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Every 5 minutes:</span> Real-time data sync
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Every hour:</span> Update statistics
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Daily at 2 AM:</span> Generate reports
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Weekly on Monday:</span> Send newsletters
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Monthly:</span> Archive old data
                  </div>
                  <div className="p-2 rounded bg-orange-500/10 text-xs font-mono text-orange-300">
                    <span className="text-orange-200">Custom cron:</span> Complex timing
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Example */}
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-orange-200 font-semibold font-mono mb-3 flex items-center gap-2">
                <span className="text-orange-400">🎯</span> Example: "Daily Report Generator"
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">⏰ Timing: Every day at 8:00 AM</div>
                  <div className="text-xs font-mono text-orange-300">
                    Automatically runs every morning to prepare daily insights
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">📊 Data Processing</div>
                  <div className="text-xs font-mono text-orange-300">
                    Analyze yesterday's Posts, count views, calculate engagement metrics
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">🤖 AI Analysis</div>
                  <div className="text-xs font-mono text-orange-300">
                    "Generate insights and recommendations based on yesterday's performance data"
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="text-sm font-mono text-orange-200 mb-2">💾 Save Results</div>
                  <div className="text-xs font-mono text-orange-300">
                    Create new Report record with AI-generated insights and metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

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
      
      // Handle final completion - keep streaming until we get the completion event
      if (stepData.status === 'complete' && (stepData.step === 'complete' || mappedStepId === 'complete')) {
        // setArtifact((draftArtifact) => ({
        //   ...draftArtifact,
        //   isVisible: true,
        //   status: 'streaming', // Keep as streaming initially
        // }));
        
        // Set to idle after a brief delay to ensure all text-delta content has been processed
        // The status change from 'streaming' to 'idle' will trigger document refetch in the main component
        setTimeout(() => {
          setArtifact((draftArtifact) => ({
            ...draftArtifact,
            status: 'idle',
          }));
        }, 1500); // 1.5 second delay to allow orchestrator to complete saving
      }
    }

    // Handle dedicated completion events (would need to be added to server-side)
    // For now, we'll use the existing agent-step complete detection but make it more reliable
    if (streamPart.type === 'agent-step') {
      const stepData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      // When we receive the final complete step, set artifact to idle after a brief delay
      // to ensure all text-delta content has been processed
      if (stepData.status === 'complete' && stepData.step === 'complete') {
        setTimeout(() => {
          setArtifact((draftArtifact) => ({
            ...draftArtifact,
            status: 'idle',
          }));
        }, 1200); // 1.2 second delay to allow orchestrator to complete saving
      }
    }
    
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