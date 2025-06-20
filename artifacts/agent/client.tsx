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

interface AgentModel {
  id: string;
  name: string;
  idField: string;
  displayFields: string[];
  fields: AgentField[];
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
  name: string;
  description: string;
  type: 'Create' | 'Update';
  schedule?: {
    enabled: boolean;
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
  domain?: string;
  models: AgentModel[];
  enums: AgentEnum[];
  actions: AgentAction[];
  createdAt: string;
}

interface AgentArtifactMetadata {
  selectedTab: 'models' | 'enums' | 'actions';
  editingModel: string | null;
  editingEnum: string | null;
  editingAction: string | null;
  currentStep?: string;
  stepProgress?: {
    overview?: 'processing' | 'complete';
    models?: 'processing' | 'complete';
    enums?: 'processing' | 'complete';
    actions?: 'processing' | 'complete';
  };
  stepMessages?: Record<string, string>;
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
    'action': 'act'
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

// Progress Indicator Component
const StepProgressIndicator = ({ currentStep = '', agentData, stepMessages = {} }: { 
  currentStep?: string, 
  agentData: any,
  stepMessages?: Record<string, string>
}) => {
  const steps = [
    { 
      id: 'overview', 
      label: 'Overview & Planning',
      shortLabel: 'Overview',
      description: 'Analyzing requirements and planning system architecture',
      color: 'blue',
      icon: '🎯'
    },
    { 
      id: 'models', 
      label: 'Database Models',
      shortLabel: 'Models', 
      description: 'Creating database entities and field definitions',
      color: 'green',
      icon: '🗄️'
    },
    { 
      id: 'enums', 
      label: 'Enumerations',
      shortLabel: 'Enums',
      description: 'Defining controlled vocabularies and status types',
      color: 'purple',
      icon: '🔢'
    },
    { 
      id: 'actions', 
      label: 'Automated Actions',
      shortLabel: 'Actions',
      description: 'Building workflows and business automation logic',
      color: 'orange',
      icon: '⚡'
    }
  ];

  const getStepStatus = (stepId: string) => {
    switch (stepId) {
      case 'overview':
        return agentData?.name ? 'complete' : (currentStep === 'overview' ? 'processing' : 'inactive');
      case 'models':
        return agentData?.models?.length > 0 ? 'complete' : (currentStep === 'models' ? 'processing' : 'inactive');
      case 'enums':
        return agentData?.enums?.length > 0 ? 'complete' : (currentStep === 'enums' ? 'processing' : 'inactive');
      case 'actions':
        return agentData?.actions?.length > 0 ? 'complete' : (currentStep === 'actions' ? 'processing' : 'inactive');
      default:
        return 'inactive';
    }
  };

  const completedSteps = steps.filter(step => getStepStatus(step.id) === 'complete').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Building Your AI Agent</h3>
          <p className="text-sm text-gray-600 mt-1">
            {completedSteps === steps.length 
              ? '🎉 Agent successfully built!' 
              : `Step ${completedSteps + 1} of ${steps.length} - ${steps.find(s => s.id === currentStep)?.label || 'Processing'}`
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
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
          const status = getStepStatus(step.id);
          const isActive = currentStep === step.id;
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
                    {step.label}
                  </h4>
                  
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    status === 'complete' 
                      ? 'bg-green-100 text-green-800' 
                      : status === 'processing' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {status === 'complete' ? 'Complete' : status === 'processing' ? 'Processing' : 'Pending'}
                  </span>
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
                    {step.id === 'enums' && agentData.enums && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.enums.length} enumerations defined
                      </span>
                    )}
                    {step.id === 'actions' && agentData.actions && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                        {agentData.actions.length} actions automated
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
                Your <strong>{agentData.name}</strong> is ready with {agentData.models?.length || 0} models, {agentData.enums?.length || 0} enums, and {agentData.actions?.length || 0} automated actions.
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
  allEnums
}: { 
  model: AgentModel;
  onUpdate: (model: AgentModel) => void;
  onDelete: () => void;
  allModels: AgentModel[];
  allEnums: AgentEnum[];
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const addField = useCallback(() => {
    const newField: AgentField = {
      id: generateNewId('field', model.fields),
      name: '',
      type: 'String',
      isId: false,
      unique: false,
      list: false,
      required: false,
      kind: 'scalar',
      relationField: false,
      title: '',
      sort: false,
      order: model.fields.length,
      defaultValue: ''
    };
    
    onUpdate({
      ...model,
      fields: [...model.fields, newField]
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
    onUpdate({
      ...model,
      fields: model.fields.filter(field => field.id !== fieldId)
    });
  }, [model, onUpdate]);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div>
            <Label htmlFor={`model-name-${model.id}`}>Model Name</Label>
            <Input
              id={`model-name-${model.id}`}
              value={model.name}
              onChange={(e) => onUpdate({ ...model, name: e.target.value })}
              placeholder="Model name (e.g., User, Post, Order)"
            />
          </div>
          <div>
            <Label htmlFor={`model-id-field-${model.id}`}>ID Field</Label>
            <Input
              id={`model-id-field-${model.id}`}
              value={model.idField}
              onChange={(e) => onUpdate({ ...model, idField: e.target.value })}
              placeholder="ID field name (e.g., id)"
            />
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="ml-4"
        >
          <CrossIcon size={16} />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fields</Label>
          <Button size="sm" onClick={addField}>
            <PlusIcon size={16} />
            Add Field
          </Button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {model.fields.map((field) => (
            <div key={field.id} className="border rounded p-3 space-y-2">
              {editingField === field.id ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Field name"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField(field.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Kind</Label>
                    <Select
                      value={field.kind}
                      onValueChange={(value: 'scalar' | 'object' | 'enum') => 
                        updateField(field.id, { kind: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_KINDS.map(kind => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {kind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={field.title}
                      onChange={(e) => updateField(field.id, { title: e.target.value })}
                      placeholder="Display title"
                    />
                  </div>
                  <div className="col-span-2 flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      />
                      <span>Required</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.unique}
                        onChange={(e) => updateField(field.id, { unique: e.target.checked })}
                      />
                      <span>Unique</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.list}
                        onChange={(e) => updateField(field.id, { list: e.target.checked })}
                      />
                      <span>List</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.relationField}
                        onChange={(e) => updateField(field.id, { relationField: e.target.checked })}
                      />
                      <span>Relation</span>
                    </label>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteField(field.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 p-2 rounded border-0 bg-transparent text-left"
                  onClick={() => setEditingField(field.id)}
                >
                  <div>
                    <span className="font-medium">{field.name || 'Unnamed Field'}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {field.type} {field.required && '(required)'} {field.unique && '(unique)'}
                    </span>
                  </div>
                  <PencilEditIcon size={16} />
                </button>
              )}
            </div>
          ))}
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
      name: '',
      type: 'String',
      defaultValue: ''
    };
    
    onUpdate({
      ...enumItem,
      fields: [...enumItem.fields, newField]
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
    onUpdate({
      ...enumItem,
      fields: enumItem.fields.filter(field => field.id !== fieldId)
    });
  }, [enumItem, onUpdate]);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label htmlFor={`enum-name-${enumItem.id}`}>Enum Name</Label>
          <Input
            id={`enum-name-${enumItem.id}`}
            value={enumItem.name}
            onChange={(e) => onUpdate({ ...enumItem, name: e.target.value })}
            placeholder="Enum name (e.g., UserRole, OrderStatus)"
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="ml-4"
        >
          <CrossIcon size={16} />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Values</Label>
          <Button size="sm" onClick={addField}>
            <PlusIcon size={16} />
            Add Value
          </Button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {enumItem.fields.map((field) => (
            <div key={field.id} className="border rounded p-3">
              {editingField === field.id ? (
                <div className="space-y-2">
                  <div>
                    <Label>Value Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Value name (e.g., ADMIN, PENDING)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteField(field.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 p-2 rounded border-0 bg-transparent text-left"
                  onClick={() => setEditingField(field.id)}
                >
                  <span className="font-medium">{field.name || 'Unnamed Value'}</span>
                  <PencilEditIcon size={16} />
                </button>
              )}
            </div>
          ))}
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
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div>
            <Label>Action Name</Label>
            <Input
              value={action.name}
              onChange={(e) => onUpdate({ ...action, name: e.target.value })}
              placeholder="Action name (e.g., createUser, processOrder)"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={action.description}
              onChange={(e) => onUpdate({ ...action, description: e.target.value })}
              placeholder="Describe what this action does..."
              rows={2}
            />
          </div>
          <div>
            <Label>Action Type</Label>
            <Select
              value={action.type}
              onValueChange={(value: 'Create' | 'Update') => 
                onUpdate({ ...action, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Create">Create</SelectItem>
                <SelectItem value="Update">Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="ml-4"
        >
          <CrossIcon size={16} />
        </Button>
      </div>

      {/* Schedule Configuration */}
      <div className="space-y-2">
        <Label>Schedule (Optional)</Label>
        <div className="space-y-2 p-3 border rounded">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={action.schedule?.enabled || false}
              onChange={(e) => onUpdate({
                ...action,
                schedule: {
                  ...action.schedule,
                  enabled: e.target.checked,
                  pattern: action.schedule?.pattern || '',
                  timezone: action.schedule?.timezone || 'UTC',
                  active: action.schedule?.active || true
                }
              })}
            />
            <span>Enable Scheduling</span>
          </label>
          {action.schedule?.enabled && (
            <div>
              <Label>Schedule Pattern</Label>
              <Input
                value={action.schedule.pattern}
                onChange={(e) => onUpdate({
                  ...action,
                  schedule: { ...action.schedule!, pattern: e.target.value }
                })}
                placeholder="e.g., every 5 minutes, daily at 9am, weekly on monday"
              />
            </div>
          )}
        </div>
      </div>

      {/* Data Source Configuration */}
      <div className="space-y-2">
        <Label>Data Source</Label>
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
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="database">Database Query</SelectItem>
            <SelectItem value="custom">Custom Function</SelectItem>
          </SelectContent>
        </Select>
        
        {action.dataSource.type === 'custom' && (
          <div>
            <Label>Custom Code</Label>
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
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Execute Configuration */}
      <div className="space-y-2">
        <Label>Execute</Label>
        <Select
          value={action.execute.type}
          onValueChange={(value: 'code' | 'prompt') => 
            onUpdate({
              ...action,
              execute: {
                type: value,
                ...(value === 'code' ? { code: { script: '' } } : { prompt: { template: '' } })
              }
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Code Script</SelectItem>
            <SelectItem value="prompt">AI Prompt</SelectItem>
          </SelectContent>
        </Select>
        
        {action.execute.type === 'code' && (
          <div>
            <Label>Script Code</Label>
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
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        )}
        
        {action.execute.type === 'prompt' && (
          <div>
            <Label>AI Prompt Template</Label>
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
              rows={4}
            />
          </div>
        )}
      </div>

      {/* Results Configuration */}
      <div className="space-y-2">
        <Label>Results</Label>
        <div className="space-y-2 p-3 border rounded">
          <div>
            <Label>Target Model</Label>
            <Select
              value={action.results.model}
              onValueChange={(value) => onUpdate({
                ...action,
                results: { ...action.results, model: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {allModels.map(model => (
                  <SelectItem key={model.id} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
  setMetadata
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
}) => {
  // Initialize metadata with defaults if null
  const safeMetadata = metadata || {
    selectedTab: 'models' as const,
    editingModel: null,
    editingEnum: null,
    editingAction: null,
    currentStep: 'complete',
    stepProgress: {
      overview: 'complete' as const,
      models: 'complete' as const,
      enums: 'complete' as const,
      actions: 'complete' as const,
    },
    stepMessages: {}
  };

  // Update metadata safely
  const updateMetadata = useCallback((updates: Partial<AgentArtifactMetadata>) => {
    if (setMetadata) {
      setMetadata({ ...safeMetadata, ...updates });
    }
  }, [safeMetadata, setMetadata]);

  const [agentData, setAgentData] = useState<AgentData>(() => {
    console.log('🏗️ Initializing agent data from content:', content);
    console.log('🏗️ Content type:', typeof content);
    console.log('🏗️ Content length:', content?.length || 0);
    
    try {
      const parsed = JSON.parse(content || '{}');
      console.log('✅ Successfully parsed initial content:', JSON.stringify(parsed, null, 2));
      console.log('🔍 Parsed data structure check:', {
        hasName: !!parsed.name,
        hasDescription: !!parsed.description,
        hasDomain: !!parsed.domain,
        hasModels: !!parsed.models,
        modelsIsArray: Array.isArray(parsed.models),
        modelsLength: parsed.models?.length || 0,
        hasEnums: !!parsed.enums,
        enumsIsArray: Array.isArray(parsed.enums),
        enumsLength: parsed.enums?.length || 0,
        hasActions: !!parsed.actions,
        actionsIsArray: Array.isArray(parsed.actions),
        actionsLength: parsed.actions?.length || 0,
      });
      
      const initialData = {
        name: parsed.name || 'New Agent',
        description: parsed.description || '',
        domain: parsed.domain || '',
        models: parsed.models || [],
        enums: parsed.enums || [],
        actions: parsed.actions || [],
        createdAt: parsed.createdAt || new Date().toISOString()
      };
      console.log('📊 Initial agent data:', JSON.stringify(initialData, null, 2));
      console.log('📊 Final data stats:', {
        modelsCount: initialData.models.length,
        enumsCount: initialData.enums.length,
        actionsCount: initialData.actions.length,
        totalFields: initialData.models.reduce((sum: number, model: any) => sum + (model.fields?.length || 0), 0)
      });
      return initialData;
    } catch (e) {
      console.warn('⚠️ Failed to parse initial content, using defaults:', e);
      console.warn('⚠️ Problematic content:', content);
      const defaultData = {
        name: 'New Agent',
        description: '',
        domain: '',
        models: [],
        enums: [],
        actions: [],
        createdAt: new Date().toISOString()
      };
      console.log('📊 Default agent data:', JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
  });

  // Update content when agent data changes
  const updateAgentData = useCallback((newData: AgentData) => {
    console.log('🔄 Updating agent data:', JSON.stringify(newData, null, 2));
    setAgentData(newData);
    const jsonContent = JSON.stringify(newData, null, 2);
    console.log('💾 Saving content to artifact:', jsonContent);
    onSaveContent(jsonContent, true);
  }, [onSaveContent]);

  // Monitor content changes from external sources (like when opening from chat)
  useEffect(() => {
    console.log('👀 Content prop changed, current content:', content);
    console.log('👀 Content length:', content?.length || 0);
    
    if (content && content.trim() !== '{}' && content.trim() !== '') {
      try {
        const parsed = JSON.parse(content);
        console.log('🔄 Parsing updated content:', JSON.stringify(parsed, null, 2));
        
        // Only update if the content is different from current state
        const currentDataString = JSON.stringify(agentData);
        const newDataString = JSON.stringify({
          name: parsed.name || 'New Agent',
          description: parsed.description || '',
          domain: parsed.domain || '',
          models: parsed.models || [],
          enums: parsed.enums || [],
          actions: parsed.actions || [],
          createdAt: parsed.createdAt || new Date().toISOString()
        });
        
        if (currentDataString !== newDataString) {
          console.log('🔄 Content changed, updating agent data');
          console.log('🔄 Old data:', currentDataString);
          console.log('🔄 New data:', newDataString);
          
          const updatedData = {
            name: parsed.name || 'New Agent',
            description: parsed.description || '',
            domain: parsed.domain || '',
            models: parsed.models || [],
            enums: parsed.enums || [],
            actions: parsed.actions || [],
            createdAt: parsed.createdAt || new Date().toISOString()
          };
          
          setAgentData(updatedData);
          console.log('✅ Agent data updated from content change');
        } else {
          console.log('📋 Content unchanged, skipping update');
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse updated content:', e);
        console.warn('⚠️ Problematic content:', content);
      }
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
      name: '',
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
          order: 0
        },
        {
          id: 'fld2',
          name: 'createdAt',
          type: 'DateTime',
          isId: false,
          unique: false,
          list: false,
          required: true,
          kind: 'scalar',
          relationField: false,
          title: 'Created At',
          sort: true,
          order: 1
        },
        {
          id: 'fld3',
          name: 'updatedAt',
          type: 'DateTime',
          isId: false,
          unique: false,
          list: false,
          required: true,
          kind: 'scalar',
          relationField: false,
          title: 'Updated At',
          sort: false,
          order: 2
        }
      ]
    };
    
    updateAgentData({
      ...agentData,
      models: [...(agentData.models || []), newModel]
    });
  };

  const addEnum = () => {
    const newEnum: AgentEnum = {
      id: generateNewId('enum', agentData.enums || []),
      name: '',
      fields: []
    };
    
    updateAgentData({
      ...agentData,
      enums: [...(agentData.enums || []), newEnum]
    });
  };

  const addAction = () => {
    const newAction: AgentAction = {
      name: '',
      description: '',
      type: 'Create',
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
    
    updateAgentData({
      ...agentData,
      actions: [...(agentData.actions || []), newAction]
    });
  };

  // Tab configuration
  const tabs = [
    {
      id: 'models' as const,
      label: 'Models',
      count: agentData.models?.length || 0
    },
    {
      id: 'enums' as const,
      label: 'Enums',
      count: agentData.enums?.length || 0
    },
    {
      id: 'actions' as const,
      label: 'Actions',
      count: agentData.actions?.length || 0
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
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <div className="text-black text-lg">🤖</div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-matrix-gradient bg-clip-text font-mono">
                    Agent Builder
                  </h1>
                  <p className="text-green-400 text-sm font-medium font-mono">
                    Design and configure your AI agent system
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/50 border border-green-500/20 backdrop-blur-sm">
                <div className="status-indicator status-online">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-matrix-pulse"></div>
                </div>
                <span className="text-sm font-medium text-green-400 font-mono">Ready</span>
              </div>
              
              {/* Save Button */}
              <Button
                onClick={() => onSaveContent(JSON.stringify(agentData, null, 2), false)}
                className="btn-matrix px-6 py-2.5 text-sm font-medium font-mono"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4">💾</div>
                  <span>Save Agent</span>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Enhanced Progress Indicator */}
          <div className="mt-6 p-4 rounded-2xl bg-black/50 border border-green-500/20 backdrop-blur-sm shadow-lg shadow-green-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-green-200 font-mono">Build Progress</div>
                <div className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium font-mono border border-green-500/30">
                  {agentData?.name || 'AI Agent System'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-matrix-gradient bg-clip-text font-mono">
                  {safeMetadata.stepProgress ? 
                    Object.values(safeMetadata.stepProgress).filter(status => status === 'complete').length * 25 : 
                    100}%
                </div>
                <div className="text-xs text-green-400 font-mono">Complete</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-2 bg-green-500/10 rounded-full overflow-hidden border border-green-500/20">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full transition-all duration-700 ease-out shadow-lg shadow-green-500/30"
                style={{ width: `${
                  safeMetadata.stepProgress ? 
                    Object.values(safeMetadata.stepProgress).filter(status => status === 'complete').length * 25 : 
                    100
                }%` }}
              />
            </div>
            
            {/* Progress Steps */}
            <div className="flex justify-between mt-4 text-xs font-mono">
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow" />
                <span className="text-green-400 font-medium">Overview</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow" />
                <span className="text-green-400 font-medium">Models</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow" />
                <span className="text-green-400 font-medium">Enums</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-matrix-glow" />
                <span className="text-green-400 font-medium">Actions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative border-b border-green-500/20 backdrop-blur-xl bg-black/50">
        <div className="px-8">
          <div className="flex gap-2 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => updateMetadata({ selectedTab: tab.id })}
                className={cn(
                  "relative px-6 py-4 text-sm font-medium font-mono transition-all duration-300 border-b-2 group",
                  safeMetadata.selectedTab === tab.id
                    ? "text-green-300 border-green-400 bg-green-500/10"
                    : "text-green-500 border-transparent hover:text-green-300 hover:bg-green-500/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{tab.label}</span>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold font-mono transition-colors border",
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
            {safeMetadata.selectedTab === 'models' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-green-200 font-mono">Database Models</h2>
                    <p className="text-green-400 font-mono">Define your data structures and relationships</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                      <span className="text-green-400 text-sm font-medium font-mono">
                        {agentData.models?.length || 0} models created
                      </span>
                    </div>
                  </div>
                </div>
                
                {agentData.models && agentData.models.length > 0 ? (
                  <div className="grid gap-6">
                    {agentData.models.map((model, index) => (
                      <div key={model.id || index} className="card-matrix p-6 animate-slide-up hover:shadow-matrix-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                <div className="text-green-400 text-sm">📊</div>
                              </div>
                              <h3 className="text-xl font-bold text-green-200 font-mono">{model.name || `Model ${index + 1}`}</h3>
                            </div>
                            <p className="text-green-400 text-sm font-mono">
                              Primary entity with {model.fields?.length || 0} defined fields
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                              <span className="text-green-300 text-xs font-medium font-mono">
                                {model.fields?.length || 0} fields
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {model.fields && model.fields.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                              <h4 className="text-sm font-semibold text-green-200 font-mono">Field Definitions</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {model.fields.map((field, fieldIndex) => (
                                <div key={field.id || fieldIndex} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-green-200 text-sm font-mono font-medium group-hover:text-green-300 transition-colors">
                                      {field.name}
                                    </span>
                                    <span className="text-green-400 text-xs font-medium px-2 py-1 rounded bg-green-800/50">
                                      {field.type}
                                    </span>
                                  </div>
                                  {(field.required || field.unique) && (
                                    <div className="flex gap-2 mt-2">
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
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-800/50 to-green-900/50 flex items-center justify-center border border-green-500/20">
                      <div className="text-4xl opacity-60">📊</div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-300 mb-2 font-mono">No Models Defined</h3>
                    <p className="text-green-500 max-w-md mx-auto font-mono">
                      Your database models will appear here once they're created by the AI agent builder.
                    </p>
                  </div>
                )}
              </div>
            )}

            {safeMetadata.selectedTab === 'enums' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-green-200 font-mono">Enumerations</h2>
                    <p className="text-green-400 font-mono">Controlled vocabularies and status types</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                      <span className="text-purple-400 text-sm font-medium font-mono">
                        {agentData.enums?.length || 0} enums defined
                      </span>
                    </div>
                  </div>
                </div>
                
                {agentData.enums && agentData.enums.length > 0 ? (
                  <div className="grid gap-6">
                    {agentData.enums.map((enumItem, index) => (
                      <div key={enumItem.id || index} className="card-matrix p-6 animate-slide-up hover:shadow-matrix-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <div className="text-purple-400 text-sm">🔢</div>
                              </div>
                              <h3 className="text-xl font-bold text-green-200 font-mono">{enumItem.name || `Enum ${index + 1}`}</h3>
                            </div>
                            <p className="text-green-400 text-sm font-mono">
                              Controlled vocabulary with {enumItem.fields?.length || 0} defined values
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <span className="text-purple-300 text-xs font-medium font-mono">
                                {enumItem.fields?.length || 0} values
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {enumItem.fields && enumItem.fields.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                              <h4 className="text-sm font-semibold text-green-200 font-mono">Enumeration Values</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {enumItem.fields.map((field, fieldIndex) => (
                                <span key={field.id || fieldIndex} className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-200 text-sm font-mono rounded-xl hover:bg-green-500/20 transition-colors">
                                  {field.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-800/50 to-green-900/50 flex items-center justify-center border border-green-500/20">
                      <div className="text-4xl opacity-60">🔢</div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-300 mb-2 font-mono">No Enumerations Defined</h3>
                    <p className="text-green-500 max-w-md mx-auto font-mono">
                      Your controlled vocabularies will appear here once they're created by the AI agent builder.
                    </p>
                  </div>
                )}
              </div>
            )}

            {safeMetadata.selectedTab === 'actions' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-green-200 font-mono">Automated Actions</h2>
                    <p className="text-green-400 font-mono">Intelligent workflows and business automation</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                      <span className="text-orange-400 text-sm font-medium font-mono">
                        {agentData.actions?.length || 0} actions configured
                      </span>
                    </div>
                  </div>
                </div>
                
                {agentData.actions && agentData.actions.length > 0 ? (
                  <div className="grid gap-6">
                    {agentData.actions.map((action, index) => (
                      <div key={index} className="card-matrix p-6 animate-slide-up hover:shadow-matrix-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                <div className="text-orange-400 text-sm">⚡</div>
                              </div>
                              <h3 className="text-xl font-bold text-green-200 font-mono">{action.name || `Action ${index + 1}`}</h3>
                            </div>
                            {action.description && (
                              <p className="text-green-400 text-sm font-mono leading-relaxed max-w-2xl">
                                {action.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-xs font-medium font-mono border",
                              action.type === 'Create' 
                                ? "bg-green-500/10 border-green-500/20 text-green-300"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                            )}>
                              {action.type}
                            </div>
                          </div>
                        </div>
                        
                        {action.execute && (
                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                              <h4 className="text-sm font-semibold text-green-200 font-mono">Execution Configuration</h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700 font-mono">
                                <span className="text-green-300 text-xs font-medium">Type:</span>
                                <span className="text-green-200 text-xs font-mono ml-2">{action.execute.type}</span>
                              </div>
                              {action.results?.model && (
                                <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700 font-mono">
                                  <span className="text-green-300 text-xs font-medium">Target:</span>
                                  <span className="text-green-200 text-xs font-mono ml-2">{action.results.model}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-800/50 to-green-900/50 flex items-center justify-center border border-green-500/20">
                      <div className="text-4xl opacity-60">⚡</div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-300 mb-2 font-mono">No Actions Configured</h3>
                    <p className="text-green-500 max-w-md mx-auto font-mono">
                      Your automated workflows will appear here once they're created by the AI agent builder.
                    </p>
                  </div>
                )}
              </div>
            )}
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
      editingEnum: null,
      editingAction: null,
    });
  },
  
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    console.log('🎯 Agent artifact received stream part:', streamPart.type);
    console.log('📦 Stream part content:', streamPart.content);
    
    if (streamPart.type === 'agent-data') {
      console.log('📊 Processing agent-data...');
      const agentData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      console.log('✅ Parsed agent data:', JSON.stringify(agentData, null, 2));
        
      setArtifact((draftArtifact) => {
        console.log('🔄 Updating artifact with new data');
        return {
          ...draftArtifact,
          content: JSON.stringify(agentData, null, 2),
          isVisible: true,
          status: 'streaming',
        };
      });
    }
    
    if (streamPart.type === 'agent-step') {
      console.log('👣 Processing agent-step...');
      const stepData = typeof streamPart.content === 'string' 
        ? JSON.parse(streamPart.content) 
        : streamPart.content;
      
      console.log('✅ Parsed step data:', JSON.stringify(stepData, null, 2));
        
      setMetadata((draftMetadata) => {
        console.log('🔄 Updating metadata with step progress');
        const newMetadata = {
          ...(draftMetadata || {}),
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
        console.log('📊 New metadata:', JSON.stringify(newMetadata, null, 2));
        return newMetadata;
      });
      
      if (stepData.status === 'processing') {
        console.log('👁️ Making artifact visible due to processing step');
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          isVisible: true,
          status: 'streaming',
        }));
      }
    }
    
    if (streamPart.type === 'text-delta') {
      console.log('📝 Processing text-delta...');
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