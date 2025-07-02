import * as React from 'react';
import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import { StepFieldEditor } from './StepFieldEditor';
import { ModelExecutionChangesViewer } from './ModelExecutionChangesViewer';
import { ScheduleMindMapEditor } from './ScheduleMindMapEditor';
import type { AgentSchedule, EnvVar, PseudoCodeStep, StepField, AgentModel } from '../../types';
import { generateNewId } from '../../utils';

interface ScheduleEditorProps {
  schedule: AgentSchedule;
  onUpdate: (schedule: AgentSchedule) => void;
  onDelete: () => void;
  allModels?: AgentModel[];
  documentId?: string;
}

interface InputParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  kind?: 'scalar' | 'object' | 'enum';
  relationModel?: string;
  list?: boolean;
}

interface GeneratedCodeData {
  code: string;
  envVars: EnvVar[];
  inputParameters: InputParameter[];
  outputParameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  estimatedExecutionTime: string;
  testData: {
    input: Record<string, any>;
    expectedOutput: Record<string, any>;
  };
}

export const ScheduleEditor = memo(({
  schedule,
  onUpdate,
  onDelete,
  allModels = [],
  documentId
}: ScheduleEditorProps) => {
  const [viewMode, setViewMode] = useState<'traditional' | 'mindmap'>('mindmap');
  const [pseudoSteps, setPseudoSteps] = useState<PseudoCodeStep[]>(schedule.pseudoSteps || []);
  
  // Traditional view state
  const [envVars, setEnvVars] = useState<EnvVar[]>(schedule.execute?.code?.envVars || []);
  const [executeCode, setExecuteCode] = useState(schedule.execute?.code?.script || '');
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generatedCodeData, setGeneratedCodeData] = useState<GeneratedCodeData | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [executionMode, setExecutionMode] = useState<'test' | 'production'>('test');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [showRunModeModal, setShowRunModeModal] = useState(false);
  const [newListValue, setNewListValue] = useState('');
  const [viewingModelChanges, setViewingModelChanges] = useState<any>(null);

  const [scheduleInputParameters, setScheduleInputParameters] = useState<InputParameter[]>([]);
  const [inputParametersCollapsed, setInputParametersCollapsed] = useState(true);
  const [outputParametersCollapsed, setOutputParametersCollapsed] = useState(true);

  // Callback functions
  const extractInputParametersFromSteps = useCallback((steps: PseudoCodeStep[]): InputParameter[] => {
    if (!steps || steps.length === 0) return [];
    
    const firstStep = steps[0];
    if (!firstStep.inputFields || firstStep.inputFields.length === 0) return [];
    
    // Filter out empty fields and convert to input parameters
    return firstStep.inputFields
      .filter(field => field.name && field.name.trim() !== '')
      .map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        description: field.description || `Input parameter for ${field.name}`,
        kind: (field.kind === 'object' ? 'object' : field.kind === 'enum' ? 'enum' : 'scalar') as 'scalar' | 'object' | 'enum',
        relationModel: field.relationModel,
        list: field.list
      }));
  }, []);

  useEffect(() => {
    const extractedParams = extractInputParametersFromSteps(pseudoSteps);
    setScheduleInputParameters(extractedParams);
  }, [pseudoSteps, extractInputParametersFromSteps]);

  useEffect(() => {
    const migratedSteps = (schedule.pseudoSteps || []).map(step => {
      // Check if step needs migration from old structure
      if ('inputObjects' in step && Array.isArray(step.inputObjects)) {
        const inputFields: StepField[] = step.inputObjects.map((name, index) => ({
          id: generateNewId('field', []),
          name: name || `input${index + 1}`,
          type: 'String',
          kind: 'scalar' as const,
          required: false,
          list: false,
          description: ''
        }));
        
        const outputFields: StepField[] = (step as any).outputObjects?.map((name: string, index: number) => ({
          id: generateNewId('field', []),
          name: name || `output${index + 1}`,
          type: 'String',
          kind: 'scalar' as const,
          required: false,
          list: false,
          description: ''
        })) || [];

        return {
          ...step,
          inputFields: inputFields.length > 0 ? inputFields : [{
            id: generateNewId('field', []),
            name: '',
            type: 'String',
            kind: 'scalar' as const,
            required: false,
            list: false,
            description: ''
          }],
          outputFields: outputFields.length > 0 ? outputFields : [{
            id: generateNewId('field', []),
            name: '',
            type: 'String',
            kind: 'scalar' as const,
            required: false,
            list: false,
            description: ''
          }]
        };
      }
      
      // Ensure new steps have proper field arrays - never undefined or empty
      return {
        ...step,
        inputFields: (step.inputFields && step.inputFields.length > 0) ? step.inputFields : [{
          id: generateNewId('field', []),
          name: '',
          type: 'String',
          kind: 'scalar' as const,
          required: false,
          list: false,
          description: ''
        }],
        outputFields: (step.outputFields && step.outputFields.length > 0) ? step.outputFields : [{
          id: generateNewId('field', []),
          name: '',
          type: 'String',
          kind: 'scalar' as const,
          required: false,
          list: false,
          description: ''
        }]
      };
    });
    
    setPseudoSteps(migratedSteps);
    setEnvVars(schedule.execute?.code?.envVars || []);
    setExecuteCode(schedule.execute?.code?.script || '');
  }, [schedule]);

  const stepTypes = [
    { value: 'Database find unique', label: 'Database find unique' },
    { value: 'Database find many', label: 'Database find many' },
    { value: 'Database update unique', label: 'Database update unique' },
    { value: 'Database update many', label: 'Database update many' },
    { value: 'Database create', label: 'Database create' },
    { value: 'Database create many', label: 'Database create many' },
    { value: 'Database delete unique', label: 'Database delete unique' },
    { value: 'Database delete many', label: 'Database delete many' },
    { value: 'call external api', label: 'Call External API' },
    { value: 'ai analysis', label: 'AI Analysis' }
  ];

  const addPseudoStep = useCallback(() => {
    const newStep: PseudoCodeStep = {
      id: generateNewId('step', pseudoSteps),
      inputFields: [{
        id: generateNewId('field', []),
        name: '',
        type: 'String',
        kind: 'scalar',
        required: false,
        list: false,
        description: ''
      }],
      outputFields: [{
        id: generateNewId('field', []),
        name: '',
        type: 'String',
        kind: 'scalar',
        required: false,
        list: false,
        description: ''
      }],
      description: '',
      type: 'Database find many'
    };
    const updatedSteps = [...pseudoSteps, newStep];
    setPseudoSteps(updatedSteps);
    onUpdate({ ...schedule, pseudoSteps: updatedSteps });
  }, [pseudoSteps, schedule, onUpdate]);

  const updatePseudoStep = useCallback((stepId: string, updates: Partial<PseudoCodeStep>) => {
    const updatedSteps = pseudoSteps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    );
    setPseudoSteps(updatedSteps);
    onUpdate({ ...schedule, pseudoSteps: updatedSteps });
  }, [pseudoSteps, schedule, onUpdate]);

  const updateStepInputFields = useCallback((stepId: string, fields: StepField[]) => {
    updatePseudoStep(stepId, { inputFields: fields });
  }, [updatePseudoStep]);

  const updateStepOutputFields = useCallback((stepId: string, fields: StepField[]) => {
    updatePseudoStep(stepId, { outputFields: fields });
  }, [updatePseudoStep]);

  const deletePseudoStep = useCallback((stepId: string) => {
    const updatedSteps = pseudoSteps.filter(step => step.id !== stepId);
    setPseudoSteps(updatedSteps);
    onUpdate({ ...schedule, pseudoSteps: updatedSteps });
  }, [pseudoSteps, schedule, onUpdate]);

  const addEnvVar = useCallback(() => {
    const newVar: EnvVar = {
      name: '',
      description: '',
      required: true,
      sensitive: false
    };
    const updatedVars = [...envVars, newVar];
    setEnvVars(updatedVars);
    onUpdate({
      ...schedule,
      execute: {
        ...schedule.execute,
        type: 'code',
        code: {
          script: executeCode,
          envVars: updatedVars
        }
      }
    });
  }, [envVars, executeCode, schedule, onUpdate]);

  const updateEnvVar = useCallback((index: number, updates: Partial<EnvVar>) => {
    const updatedVars = envVars.map((envVar, i) => i === index ? { ...envVar, ...updates } : envVar);
    setEnvVars(updatedVars);
    onUpdate({
      ...schedule,
      execute: {
        ...schedule.execute,
        type: 'code',
        code: {
          script: executeCode,
          envVars: updatedVars
        }
      }
    });
  }, [envVars, executeCode, schedule, onUpdate]);

  const deleteEnvVar = useCallback((index: number) => {
    const updatedVars = envVars.filter((_, i) => i !== index);
    setEnvVars(updatedVars);
    onUpdate({
      ...schedule,
      execute: {
        ...schedule.execute,
        type: 'code',
        code: {
          script: executeCode,
          envVars: updatedVars
        }
      }
    });
  }, [envVars, executeCode, schedule, onUpdate]);

  const handleCodeUpdate = useCallback(() => {
    onUpdate({
      ...schedule,
      execute: {
        ...schedule.execute,
        type: 'code',
        code: {
          script: executeCode,
          envVars: envVars
        }
      }
    });
  }, [schedule, executeCode, envVars, onUpdate]);

  const generatePseudoStepsFromDescription = useCallback(async () => {
    setIsGeneratingDescription(true);
    
    try {
      if (!schedule.name.trim()) {
        onUpdate({ 
          ...schedule, 
          description: "Please enter a schedule name first to generate pseudo steps." 
        });
        return;
      }

      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schedule.name,
          description: schedule.description || `Schedule to ${schedule.name}`,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `Generate pseudo steps for ${schedule.name}. This is a scheduled task that runs automatically. Make it comprehensive and realistic for business operations.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        
        setPseudoSteps(generatedSteps);
        onUpdate({
          ...schedule,
          pseudoSteps: generatedSteps
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate pseudo steps: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating pseudo steps:', error);
      alert('Error generating pseudo steps. Please try again.');
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [schedule, onUpdate, allModels, setPseudoSteps]);

  const generatePseudoSteps = async () => {
    if (!schedule.name) {
      alert('Please enter a schedule name first');
      return;
    }

    setIsGeneratingSteps(true);
    try {
      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schedule.name,
          description: schedule.description || `Schedule to ${schedule.name}`,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `This is a scheduled task for ${schedule.name}. Make it comprehensive and realistic for business operations, not just simple CRUD operations.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSteps = data.pseudoSteps || [];
        setPseudoSteps(updatedSteps);
        onUpdate({
          ...schedule,
          pseudoSteps: updatedSteps
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate pseudo steps: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating pseudo steps:', error);
      alert('Error generating pseudo steps. Please try again.');
    } finally {
      setIsGeneratingSteps(false);
    }
  };

  const generateCode = async () => {
    if (!schedule.name || !schedule.pseudoSteps?.length) {
      alert('Please enter a schedule name and generate pseudo steps first');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const response = await fetch('/api/agent/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schedule.name,
          description: schedule.description || `Schedule to ${schedule.name}`,
          pseudoSteps: schedule.pseudoSteps,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `This is a scheduled business task for ${schedule.name}. Generate comprehensive, executable code that goes beyond simple CRUD operations.`,
          inputParameters: scheduleInputParameters
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const mergedInputParameters = [
          ...scheduleInputParameters,
          ...((data.inputParameters || []).filter((param: InputParameter) => 
            !scheduleInputParameters.some(extracted => extracted.name === param.name)
          ))
        ];
        
        setGeneratedCodeData({
          ...data,
          inputParameters: mergedInputParameters
        });
        setExecuteCode(data.code || '');
        setEnvVars(data.envVars || []);
        
        const initialInputValues: Record<string, any> = {};
        mergedInputParameters.forEach((param: InputParameter) => {
          if (param.defaultValue !== undefined) {
            initialInputValues[param.name] = param.defaultValue;
          }
        });
        setInputValues(initialInputValues);

        onUpdate({
          ...schedule,
          execute: {
            ...schedule.execute,
            type: 'code',
            code: {
              script: data.code || '',
              envVars: data.envVars || []
            }
          }
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate code: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Error generating code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const validateInputs = () => {
    const inputParams = generatedCodeData?.inputParameters || scheduleInputParameters;
    if (!inputParams || inputParams.length === 0) return { valid: true, errors: [] };

    const errors: string[] = [];
    
    inputParams.forEach(param => {
      if (param.required && !inputValues[param.name]) {
        errors.push(`Required input parameter "${param.name}" is missing`);
      }
    });

    (generatedCodeData?.envVars || envVars).forEach(envVar => {
      if (envVar.required && !envVarValues[envVar.name]) {
        errors.push(`Required environment variable "${envVar.name}" is missing`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const executeSchedule = async (testMode: boolean) => {
    if (!executeCode) {
      alert('No code to execute. Please generate code first.');
      return;
    }

    if (!documentId) {
      alert('Document ID is required to execute schedule with real database records.');
      return;
    }

    const validation = validateInputs();
    if (!validation.valid) {
      alert(`Cannot execute schedule:\n${validation.errors.join('\n')}`);
      setShowInputDialog(true);
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/agent/execute-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          scheduleId: schedule.id,
          code: executeCode,
          inputParameters: inputValues,
          envVars: envVarValues,
          testMode,
          interval: {
            pattern: schedule.interval?.pattern || '0 0 * * *',
            timezone: schedule.interval?.timezone || 'UTC',
            active: schedule.interval?.active || false
          }
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        const modeText = testMode ? 'test' : 'production';
        const dbUpdateText = result.databaseUpdated ? 'Database updated successfully!' : 'Database not modified (test mode)';
        const nextRunText = result.nextRun ? `\nNext run: ${new Date(result.nextRun).toLocaleString()}` : '';
        alert(`Schedule executed successfully in ${modeText} mode!\n\nExecution time: ${result.executionTime}ms\n${dbUpdateText}\n\nModels affected: ${result.modelsAffected?.map((m: any) => `${m.name} (${m.recordCount} records)`).join(', ') || 'None'}${nextRunText}`);
        
        // If this was production mode and successful, mark schedule as active and save input data
        if (!testMode) {
          const updatedSchedule = {
            ...schedule,
            interval: { 
              ...schedule.interval,
              pattern: schedule.interval?.pattern || '0 0 * * *',
              timezone: schedule.interval?.timezone || 'UTC', 
              active: true 
            },
            savedInputs: {
              inputParameters: inputValues,
              envVars: envVarValues,
              lastUpdated: new Date().toISOString()
            }
          };
          onUpdate(updatedSchedule);
        }
      } else {
        alert(`Schedule execution failed:\n${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error executing schedule:', error);
      alert('Error executing schedule. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const promptForInputs = (testMode: boolean) => {
    setExecutionMode(testMode ? 'test' : 'production');
    setShowRunModeModal(false);
    setShowInputDialog(true);
  };

  const handleInputDialogSubmit = () => {
    const testMode = executionMode === 'test';
    setShowInputDialog(false);
    executeSchedule(testMode);
  };

  const handleRunModeSelection = (testMode: boolean) => {
    setExecutionMode(testMode ? 'test' : 'production');
    setShowRunModeModal(false);
    promptForInputs(testMode);
  };

  const renderParameterInput = (param: InputParameter) => {
    const value = inputValues[param.name];
    
    // Handle database relation fields
    if (param.kind === 'object' && param.relationModel) {
      const relatedModel = allModels.find(m => m.name === param.relationModel);
      
      if (!relatedModel) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-sm font-mono">
              Related model "{param.relationModel}" not found
            </span>
          </div>
        );
      }

      const relatedRecords = relatedModel.records || [];
      
      if (relatedRecords.length === 0) {
        return (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-yellow-400 text-sm font-mono">
              No {param.relationModel} records available. Create some records first.
            </span>
          </div>
        );
      }

      if (param.list) {
        // Multi-select for list relations
        const selectedIds = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-2">
            <div className="text-blue-400 text-xs font-mono mb-2">
              Select multiple {param.relationModel} records ({selectedIds.length} selected)
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-lg bg-black/30 border border-blue-500/20">
              {relatedRecords.map(relatedRecord => {
                const isSelected = selectedIds.includes(relatedRecord.id);
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <label key={relatedRecord.id} className="flex items-center gap-2 p-2 hover:bg-blue-500/10 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelectedIds = e.target.checked
                          ? [...selectedIds, relatedRecord.id]
                          : selectedIds.filter((id: string) => id !== relatedRecord.id);
                        setInputValues(prev => ({ ...prev, [param.name]: newSelectedIds }));
                      }}
                      className="w-4 h-4 rounded border-blue-500/30 bg-black/50 text-blue-400 focus:ring-blue-400/20"
                    />
                    <span className="text-blue-200 text-sm font-mono flex-1">
                      {String(displayValue)}
                    </span>
                    <span className="text-blue-500 text-xs font-mono">
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
        const selectedId = value;
        
        return (
          <Select
            value={selectedId || 'none'}
            onValueChange={(newValue) => setInputValues(prev => ({ ...prev, [param.name]: newValue === 'none' ? null : newValue }))}
          >
            <SelectTrigger className="bg-black/50 border-blue-500/30 text-blue-200 focus:border-blue-400 focus:ring-blue-400/20 font-mono">
              <SelectValue placeholder={`Select ${param.relationModel}`} />
            </SelectTrigger>
            <SelectContent className="bg-black border-blue-500/30">
              <SelectItem value="none" className="text-blue-200 focus:bg-blue-500/20 font-mono">
                None selected
              </SelectItem>
              {relatedRecords.map(relatedRecord => {
                const displayField = relatedModel.displayFields[0] || relatedModel.idField;
                const displayValue = relatedRecord.data[displayField] || relatedRecord.id;
                
                return (
                  <SelectItem 
                    key={relatedRecord.id} 
                    value={relatedRecord.id} 
                    className="text-blue-200 focus:bg-blue-500/20 font-mono"
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
    if (param.kind === 'enum') {
      // For enums, we'd need to get the enum values from somewhere
      // For now, render as text input
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => setInputValues(prev => ({ ...prev, [param.name]: e.target.value }))}
          placeholder={param.description}
          className="bg-black/50 border-blue-500/30 text-blue-200 placeholder-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
        />
      );
    }

    // Handle scalar fields based on type
    if (param.list) {
      // Array input for list fields
      const arrayValue = Array.isArray(value) ? value : [];
      
      return (
        <div className="space-y-2">
          <div className="text-blue-400 text-xs font-mono mb-2">
            List values ({arrayValue.length} items)
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {arrayValue.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type={param.type === 'Int' || param.type === 'Float' ? 'number' : 'text'}
                  value={item || ''}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = param.type === 'Int' ? parseInt(e.target.value) || 0 : 
                                     param.type === 'Float' ? parseFloat(e.target.value) || 0 : e.target.value;
                    setInputValues(prev => ({ ...prev, [param.name]: newArray }));
                  }}
                  className="bg-black/50 border-blue-500/30 text-blue-200 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index);
                    setInputValues(prev => ({ ...prev, [param.name]: newArray }));
                  }}
                >
                  <CrossIcon size={14} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type={param.type === 'Int' || param.type === 'Float' ? 'number' : 'text'}
              value={newListValue}
              onChange={(e) => setNewListValue(e.target.value)}
              placeholder={`Add new ${param.type} value`}
              className="bg-black/50 border-blue-500/30 text-blue-200 placeholder-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (newListValue.trim()) {
                  const processedValue = param.type === 'Int' ? parseInt(newListValue) || 0 : 
                                       param.type === 'Float' ? parseFloat(newListValue) || 0 : newListValue;
                  setInputValues(prev => ({ 
                    ...prev, 
                    [param.name]: [...arrayValue, processedValue] 
                  }));
                  setNewListValue('');
                }
              }}
              className="px-3"
            >
              <PlusIcon size={14} />
            </Button>
          </div>
        </div>
      );
    }

    // Single scalar field
    if (param.type === 'Boolean') {
      return (
        <Select
          value={value?.toString() || 'false'}
          onValueChange={(newValue) => setInputValues(prev => ({ ...prev, [param.name]: newValue === 'true' }))}
        >
          <SelectTrigger className="bg-black/50 border-blue-500/30 text-blue-200 focus:border-blue-400 focus:ring-blue-400/20 font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-blue-500/30">
            <SelectItem value="false" className="text-blue-200 focus:bg-blue-500/20 font-mono">false</SelectItem>
            <SelectItem value="true" className="text-blue-200 focus:bg-blue-500/20 font-mono">true</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (param.type === 'Json') {
      return (
        <Textarea
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '')}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setInputValues(prev => ({ ...prev, [param.name]: parsed }));
            } catch {
              setInputValues(prev => ({ ...prev, [param.name]: e.target.value }));
            }
          }}
          placeholder="Enter JSON object"
          rows={4}
          className="bg-black/50 border-blue-500/30 text-blue-200 placeholder-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
        />
      );
    }

    return (
      <Input
        type={param.type === 'Int' || param.type === 'Float' ? 'number' : 
              param.type === 'DateTime' ? 'datetime-local' : 'text'}
        value={value || ''}
        onChange={(e) => {
          let processedValue: any = e.target.value;
          if (param.type === 'Int') {
            processedValue = parseInt(e.target.value) || 0;
          } else if (param.type === 'Float') {
            processedValue = parseFloat(e.target.value) || 0;
          }
          setInputValues(prev => ({ ...prev, [param.name]: processedValue }));
        }}
        placeholder={param.description}
        className="bg-black/50 border-blue-500/30 text-blue-200 placeholder-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
      />
    );
  };

  // Schedule interval options
  const intervalOptions = [
    { value: '*/10 * * * *', label: '10 minutes' },
    { value: '0 * * * *', label: '1 hour' },
    { value: '0 */6 * * *', label: '6 hours' },
    { value: '0 0 * * *', label: 'Daily' },
    { value: '0 0 * * 1', label: 'Weekly' },
    { value: '0 0 1 * *', label: 'Monthly' }
  ];

  // Common header with view toggle
  const viewToggleHeader = (
    <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
          <span className="text-orange-400 text-lg">⏰</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-orange-200 font-mono">Schedule Editor</h3>
          <p className="text-orange-400 text-sm font-mono">Choose your preferred editing experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* <span className="text-xs text-orange-400 font-mono">
          {viewMode === 'mindmap' ? '🧠 Mind Map' : '📝 Traditional'}
        </span> */}
        <Button
          onClick={() => setViewMode(viewMode === 'mindmap' ? 'traditional' : 'mindmap')}
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 border-orange-500/30 hover:border-orange-400"
        >
          <span className="text-sm">🔄</span>
        </Button>
      </div>
    </div>
  );

  // If mind map view is selected, render the mind map editor
  if (viewMode === 'mindmap') {
    return (
      <div className="space-y-4 max-h-screen overflow-y-auto">
        {viewToggleHeader}
        {/* Mind Map Editor */}
        <div className="min-h-[600px] max-h-screen rounded-xl border border-orange-500/20 overflow-auto">
          <ScheduleMindMapEditor
            schedule={schedule}
            onUpdate={onUpdate}
            onDelete={onDelete}
            allModels={allModels}
            documentId={documentId}
          />
        </div>
      </div>
    );
  }

  // Traditional view continues below (main implementation)
  return (
    <div className="space-y-4 max-h-screen overflow-y-auto">
      {viewToggleHeader}
      
      <div className="space-y-8">
        {/* Show ModelExecutionChangesViewer if a model is selected */}
        {viewingModelChanges && (
          <ModelExecutionChangesViewer
            modelChange={viewingModelChanges}
            onBack={() => setViewingModelChanges(null)}
          />
        )}

        {/* Show main ScheduleEditor content when not viewing model changes */}
        {!viewingModelChanges && (
          <>
            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                    <span className="text-orange-400 text-xl">⏰</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-200 font-mono">Schedule Configuration</h3>
                    <p className="text-orange-400 text-sm font-mono">Define automated scheduled tasks</p>
                  </div>
                </div>
                <Button
                  onClick={onDelete}
                  variant="destructive"
                  className="px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <CrossIcon size={16} />
                    <span>Remove Schedule</span>
                  </div>
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-orange-200 font-mono">1. Description</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input
                    id="schedule-name"
                    value={schedule.name}
                    onChange={(e) => onUpdate({ ...schedule, name: e.target.value })}
                    placeholder="e.g., Daily Data Backup, Weekly Report Generation"
                    className="bg-black/50 border-orange-500/30 text-orange-100"
                  />
                </div>

                <div>
                  <Label htmlFor="schedule-description">Description</Label>
                  <Textarea
                    id="schedule-description"
                    value={schedule.description}
                    onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
                    placeholder="Describe what this scheduled task does and its purpose..."
                    className="bg-black/50 border-orange-500/30 text-orange-100 min-h-[100px]"
                  />
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={generatePseudoStepsFromDescription}
                    disabled={!schedule.name.trim() || !schedule.description.trim() || isGeneratingDescription}
                    className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30"
                  >
                    {isGeneratingDescription ? "Generating..." : "Generate Steps"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-orange-200 font-mono">2. AI-Generated Pseudo Steps</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={addPseudoStep}
                    className="btn-matrix px-6 py-3 text-sm font-mono flex items-center gap-2"
                  >
                    <PlusIcon size={16} />
                    <span>Add Step</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {pseudoSteps.map((step, index) => (
                  <div key={step.id} className="p-4 rounded-xl bg-black/30 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-orange-300 font-mono font-medium">Step {index + 1}</h5>
                      <Button
                        onClick={() => deletePseudoStep(step.id)}
                        variant="destructive"
                        size="lg"
                      >
                        <CrossIcon size={14} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-orange-300 font-mono font-medium">Description</Label>
                        <Input
                          value={step.description}
                          onChange={(e) => updatePseudoStep(step.id, { description: e.target.value })}
                          placeholder="Describe this step"
                          className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-orange-300 font-mono font-medium">Step Type</Label>
                        <Select 
                          value={step.type} 
                          onValueChange={(value) => updatePseudoStep(step.id, { type: value as PseudoCodeStep['type'] })}
                        >
                          <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 focus:border-orange-400 focus:ring-orange-400/20 font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stepTypes.map(type => (
                              <SelectItem key={type.value} value={type.value} className="font-mono">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <StepFieldEditor
                          fields={step.inputFields || []}
                          onFieldsChange={(fields: StepField[]) => updateStepInputFields(step.id, fields)}
                          label={index === 0 ? "Input Fields (Schedule Inputs)" : "Input Fields"}
                          color="orange"
                          allModels={allModels}
                        />
                        {index === 0 && step.inputFields && step.inputFields.some(f => f.name && f.name.trim() !== '') && (
                          <div className="text-xs text-orange-400/70 font-mono mt-1">
                            ℹ️ These fields will be used as schedule input parameters
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <StepFieldEditor
                          fields={step.outputFields || []}
                          onFieldsChange={(fields: StepField[]) => updateStepOutputFields(step.id, fields)}
                          label="Output Fields"
                          color="orange"
                          allModels={allModels}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {pseudoSteps.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No steps defined yet.</p>
                    <p className="text-sm mt-2">
                      Click 'Generate Steps' at the bottom of Section 1 to get started.
                    </p>
                  </div>
                ) : null}

                {pseudoSteps.length > 0 && (
                  <div className="flex justify-center pt-4 border-t border-orange-500/20">
                    <Button
                      onClick={generateCode}
                      disabled={isGeneratingCode}
                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30"
                    >
                      {isGeneratingCode ? "Generating..." : "Generate Code"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-orange-200 font-mono">3. Generated Executable Code</h4>
              </div>
              
              <div className="space-y-6">
                {(scheduleInputParameters.length > 0 || (generatedCodeData?.inputParameters && generatedCodeData.inputParameters.length > 0)) && (
                  <div className="space-y-4">
                    <h5 className="text-orange-300 font-mono font-medium">Input Parameters</h5>
                    <div className="space-y-3">
                      {(generatedCodeData?.inputParameters || scheduleInputParameters).map((param: InputParameter, index: number) => (
                        <div key={index} className="p-3 rounded-lg bg-black/30 border border-orange-500/20">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-orange-200 font-mono font-semibold">
                                {param.name} {param.required && <span className="text-red-400">*</span>}
                              </div>
                              <div className="text-xs text-orange-400/70 font-mono">
                                Type: {param.type} 
                                {param.kind === 'object' && (
                                  <span className="text-orange-400 ml-1">(Database Relation)</span>
                                )}
                                {param.list && <span className="text-orange-400 ml-1">[List]</span>}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              {param.description && (
                                <div className="text-xs text-orange-400/70 font-mono">
                                  📝 {param.description}
                                </div>
                              )}
                              {param.defaultValue && (
                                <div className="text-xs text-orange-400/70 font-mono">
                                  Default: {typeof param.defaultValue === 'object' ? JSON.stringify(param.defaultValue) : param.defaultValue}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-orange-300 font-mono font-medium">Environment Variables</Label>
                    <Button
                      onClick={addEnvVar}
                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30 px-4 py-2 text-sm font-mono"
                    >
                      <PlusIcon size={16} />
                      <span className="ml-2">Add Env Var</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {envVars.map((envVar, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-lg bg-black/30 border border-orange-500/20">
                        <Input
                          value={envVar.name}
                          onChange={(e) => updateEnvVar(index, { name: e.target.value })}
                          placeholder="Variable name"
                          className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                        />
                        <Input
                          value={envVar.description}
                          onChange={(e) => updateEnvVar(index, { description: e.target.value })}
                          placeholder="Description"
                          className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-orange-300 text-sm font-mono">
                            <input
                              type="checkbox"
                              checked={envVar.required}
                              onChange={(e) => updateEnvVar(index, { required: e.target.checked })}
                              className="rounded border-orange-500/30"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-1 text-orange-300 text-sm font-mono">
                            <input
                              type="checkbox"
                              checked={envVar.sensitive}
                              onChange={(e) => updateEnvVar(index, { sensitive: e.target.checked })}
                              className="rounded border-orange-500/30"
                            />
                            Sensitive
                          </label>
                        </div>
                        <Button
                          onClick={() => deleteEnvVar(index)}
                          variant="destructive"
                          size="lg"
                        >
                          <CrossIcon size={14} />
                        </Button>
                      </div>
                    ))}
                    
                    {envVars.length === 0 && (
                      <div className="text-center py-4 text-orange-400/70">
                        <p className="text-sm font-mono">No environment variables defined.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-orange-300 font-mono font-medium">Generated Code</Label>
                  <Textarea
                    value={executeCode}
                    onChange={(e) => setExecuteCode(e.target.value)}
                    onBlur={handleCodeUpdate}
                    placeholder="Generated executable JavaScript will appear here after clicking 'Generate Code' in Section 2..."
                    className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono text-sm"
                    rows={12}
                  />
                </div>

                {generatedCodeData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-black/30 border border-orange-500/20">
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer mb-2" 
                        onClick={() => setInputParametersCollapsed(!inputParametersCollapsed)}
                      >
                        <h5 className="text-orange-300 font-mono font-medium">
                          Input Parameters ({(generatedCodeData.inputParameters || scheduleInputParameters).length})
                        </h5>
                        <svg 
                          className={`w-4 h-4 text-orange-300 transition-transform duration-200 ${inputParametersCollapsed ? '-rotate-90' : 'rotate-0'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {!inputParametersCollapsed && (
                        <div className="space-y-1 text-sm">
                          {(generatedCodeData.inputParameters || scheduleInputParameters).map((param: InputParameter, index: number) => (
                            <div key={index} className="text-orange-400 font-mono">
                              • {param.name} ({param.type}) {param.required && <span className="text-red-400">*</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer mb-2" 
                        onClick={() => setOutputParametersCollapsed(!outputParametersCollapsed)}
                      >
                        <h5 className="text-orange-300 font-mono font-medium">
                          Output Parameters ({generatedCodeData.outputParameters.length})
                        </h5>
                        <svg 
                          className={`w-4 h-4 text-orange-300 transition-transform duration-200 ${outputParametersCollapsed ? '-rotate-90' : 'rotate-0'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {!outputParametersCollapsed && (
                        <div className="space-y-1 text-sm">
                          {generatedCodeData.outputParameters.map((param, index) => (
                            <div key={index} className="text-orange-400 font-mono">
                              • {param.name} ({param.type})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {executionResult && (
                  <div className="p-4 rounded-lg bg-black/30 border border-orange-500/20">
                    <h5 className="text-orange-300 font-mono font-medium mb-4">Last Execution Result</h5>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 rounded-lg bg-black/20 border border-orange-500/10">
                        <div className="space-y-1">
                          <div className="text-xs text-orange-400/70 font-mono">Status</div>
                          <div className={`text-sm font-bold font-mono ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {executionResult.success ? 'SUCCESS' : 'FAILED'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-orange-400/70 font-mono">Execution Time</div>
                          <div className="text-sm text-orange-200 font-mono">
                            {executionResult.executionTime || 0}ms
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-orange-400/70 font-mono">Mode</div>
                          <div className="text-sm text-orange-200 font-mono">
                            {executionResult.testMode ? 'Test' : 'Production'}
                          </div>
                        </div>
                      </div>

                      {executionResult.success && executionResult.modelsAffected && executionResult.modelsAffected.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-green-400 font-mono">📊 Database Changes</div>
                          <div className="space-y-2">
                            {executionResult.modelsAffected.map((model: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center justify-between mb-2">
                                  <button
                                    onClick={() => setViewingModelChanges(model)}
                                    className="text-sm font-medium text-green-300 font-mono hover:text-green-200 hover:underline transition-colors cursor-pointer text-left"
                                  >
                                    {model.name} →
                                  </button>
                                  <div className="text-xs text-green-400/70 font-mono">
                                    {model.recordCount} total records
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {executionResult.result && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-orange-400 font-mono">📋 Execution Result</div>
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <pre className="text-xs text-orange-200 font-mono whitespace-pre-wrap overflow-x-auto">
                              {typeof executionResult.result === 'string' 
                                ? executionResult.result 
                                : JSON.stringify(executionResult.result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {!executionResult.success && executionResult.error && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-red-400 font-mono">❌ Error Details</div>
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <pre className="text-xs text-red-200 font-mono whitespace-pre-wrap">
                              {executionResult.error}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(executeCode || scheduleInputParameters.length > 0) && (
                  <div className="flex justify-center pt-4 border-t border-orange-500/20">
                    <Button
                      onClick={() => {
                        // Check if we have code to execute
                        if (!executeCode) {
                          alert('No code generated yet. Please click "Generate Code" in Section 2 first.');
                          return;
                        }
                        setShowRunModeModal(true);
                      }}
                      disabled={isExecuting}
                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30 px-6 py-2"
                    >
                      {isExecuting ? 'Running...' : 'Test Run'}
                    </Button>
                  </div>
                )}

                {/* Show helpful message when no code is available */}
                {!executeCode && scheduleInputParameters.length === 0 && (
                  <div className="flex justify-center pt-4 border-t border-orange-500/20">
                    <div className="text-center py-8 text-gray-400">
                      <p className="font-mono">No executable code available.</p>
                      <p className="text-sm mt-2 font-mono">
                        Complete steps 1 and 2 above to generate executable code.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-orange-200 font-mono">4. Schedule Interval</h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-orange-300 font-mono font-medium">Execution Interval</Label>
                    <Select
                      value={schedule.interval?.pattern || '0 0 * * *'}
                      onValueChange={(value) => onUpdate({
                        ...schedule,
                        interval: {
                          ...schedule.interval,
                          pattern: value
                        }
                      })}
                    >
                      <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 focus:border-orange-400 focus:ring-orange-400/20 font-mono">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        {intervalOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="font-mono">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-orange-400/70 font-mono">
                    ℹ️ Schedule Status and Controls
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-300 text-sm font-mono">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        schedule.interval?.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {schedule.interval?.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onUpdate({
                      ...schedule,
                      interval: {
                        ...schedule.interval,
                        pattern: schedule.interval?.pattern || '0 0 * * *',
                        timezone: schedule.interval?.timezone || 'UTC',
                        active: !(schedule.interval?.active || false)
                      }
                    });
                  }}
                  variant={schedule.interval?.active ? 'destructive' : 'default'}
                  className="flex-1"
                >
                  {schedule.interval?.active ? '⏸️ Pause' : '▶️ Activate'}
                </Button>
              </div>
            </div>
          </>
        )}

        {showRunModeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-orange-200 font-mono mb-4">
                Choose Run Mode
              </h3>
              
              <p className="text-orange-400 text-sm font-mono mb-6">
                Select how you want to execute this schedule:
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleRunModeSelection(true)}
                  className="w-full p-4 text-left rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 text-lg">🧪</span>
                    </div>
                    <div>
                      <h4 className="text-yellow-300 font-mono font-semibold">Test Mode</h4>
                      <p className="text-yellow-400/70 text-sm font-mono">Run safely without affecting real data</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunModeSelection(false)}
                  className="w-full p-4 text-left rounded-lg border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-lg">🚀</span>
                    </div>
                    <div>
                      <h4 className="text-green-300 font-mono font-semibold">Production Mode</h4>
                      <p className="text-green-400/70 text-sm font-mono">Execute with real data and database updates</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setShowRunModeModal(false)}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showInputDialog && (generatedCodeData || scheduleInputParameters.length > 0) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-orange-200 font-mono mb-4">
                Schedule Input Required
              </h3>
              
              <div className="space-y-6">
                {(generatedCodeData?.inputParameters || scheduleInputParameters).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Input Parameters</h4>
                    <div className="space-y-4">
                      {(generatedCodeData?.inputParameters || scheduleInputParameters).map((param: InputParameter, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-black/30 border border-orange-500/20">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <Label className="text-orange-300 font-mono text-sm font-semibold">
                                {param.name} {param.required && <span className="text-red-400">*</span>}
                              </Label>
                              <div className="text-xs text-orange-400/70 font-mono">
                                Type: {param.type} 
                                {param.kind === 'object' && (
                                  <span className="text-orange-400 ml-1">(Database Relation)</span>
                                )}
                                {param.list && <span className="text-orange-400 ml-1">[List]</span>}
                              </div>
                              {param.description && (
                                <div className="text-xs text-orange-400/70 font-mono">
                                  📝 {param.description}
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {renderParameterInput(param)}
                            </div>

                            {param.defaultValue && (
                              <div className="text-xs text-orange-400/70 font-mono">
                                Default: {typeof param.defaultValue === 'object' ? JSON.stringify(param.defaultValue) : param.defaultValue}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(generatedCodeData?.envVars || envVars).filter(e => e.required).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Required Environment Variables</h4>
                    <div className="space-y-3">
                      {(generatedCodeData?.envVars || envVars).filter(e => e.required).map((envVar, index) => (
                        <div key={index} className="space-y-1">
                          <Label className="text-orange-300 font-mono text-sm">
                            {envVar.name} {envVar.sensitive && <span className="text-yellow-400">(Sensitive)</span>}
                          </Label>
                          <Input
                            type={envVar.sensitive ? 'password' : 'text'}
                            value={envVarValues[envVar.name] || ''}
                            onChange={(e) => setEnvVarValues(prev => ({ ...prev, [envVar.name]: e.target.value }))}
                            placeholder={envVar.description}
                            className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                          />
                          <p className="text-xs text-orange-400/70 font-mono">{envVar.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setShowInputDialog(false)}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInputDialogSubmit}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30 px-4 py-2"
                >
                  Execute ({executionMode === 'test' ? 'Test' : 'Production'})
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 