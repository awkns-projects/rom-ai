import * as React from 'react';
import { memo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossIcon, PlusIcon } from '@/components/icons';
import { StepFieldEditor } from './StepFieldEditor';
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

export const ScheduleEditor = memo(({
  schedule,
  onUpdate,
  onDelete,
  allModels = [],
  documentId
}: ScheduleEditorProps) => {
  const [pseudoSteps, setPseudoSteps] = useState<PseudoCodeStep[]>(schedule.pseudoSteps || []);
  const [envVars, setEnvVars] = useState<EnvVar[]>(schedule.execute?.code?.envVars || []);
  const [executeCode, setExecuteCode] = useState(schedule.execute?.code?.script || '');
  const [showRunModeModal, setShowRunModeModal] = useState(false);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [executionMode, setExecutionMode] = useState<'test' | 'production'>('test');

  // Extract input parameters from first step
  const extractInputParameters = useCallback((): InputParameter[] => {
    if (!pseudoSteps || pseudoSteps.length === 0) return [];
    
    const firstStep = pseudoSteps[0];
    if (!firstStep.inputFields || firstStep.inputFields.length === 0) return [];
    
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
  }, [pseudoSteps]);

  // Check if schedule is ready to be activated (same logic as SchedulesListEditor)
  const isScheduleReady = useCallback((): { ready: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!schedule.name?.trim()) {
      issues.push('Schedule name is required');
    }
    
    if (!schedule.description?.trim()) {
      issues.push('Schedule description is required');
    }
    
    if (!schedule.execute?.code?.script?.trim()) {
      issues.push('No executable code generated');
    }
    
    if (!pseudoSteps || pseudoSteps.length === 0) {
      issues.push('No pseudo steps defined');
    }
    
    if (!schedule.interval?.pattern?.trim()) {
      issues.push('No execution interval set');
    }

    // Check if required input parameters have values
    const inputParams = extractInputParameters();
    const requiredInputParams = inputParams.filter(param => param.required);
    
    if (requiredInputParams.length > 0) {
      // Check if we have saved input data
      const savedInputs = schedule.savedInputs;
      if (!savedInputs || !savedInputs.inputParameters) {
        issues.push('Required input parameters need values');
      } else {
        // Check each required parameter has a value
        const missingParams = requiredInputParams.filter(param => {
          const value = savedInputs.inputParameters[param.name];
          return value === undefined || value === null || value === '';
        });
        
        if (missingParams.length > 0) {
          issues.push(`Missing values for: ${missingParams.map(p => p.name).join(', ')}`);
        }
      }
    }

    // Check if required environment variables have values
    const requiredEnvVars = envVars.filter(e => e.required);
    
    if (requiredEnvVars.length > 0) {
      const savedInputs = schedule.savedInputs;
      if (!savedInputs || !savedInputs.envVars) {
        issues.push('Required environment variables need values');
      } else {
        // Check each required env var has a value
        const missingEnvVars = requiredEnvVars.filter(envVar => {
          const value = savedInputs.envVars[envVar.name];
          return value === undefined || value === null || value === '';
        });
        
        if (missingEnvVars.length > 0) {
          issues.push(`Missing environment variables: ${missingEnvVars.map(e => e.name).join(', ')}`);
        }
      }
    }
    
    return {
      ready: issues.length === 0,
      issues
    };
  }, [schedule, pseudoSteps, extractInputParameters, envVars]);

  // Migrate old inputObjects/outputObjects to new field structure and update state
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
    { value: 'Database delete many', label: 'Database delete many' }
  ];

  const addPseudoStep = useCallback(() => {
    const newStep: PseudoCodeStep = {
      id: generateNewId('step', pseudoSteps),
      inputFields: [{
        id: generateNewId('field', []),
        name: '',
        type: 'String',
        kind: 'scalar' as const,
        required: false,
        list: false,
        description: ''
      }],
      outputFields: [{
        id: generateNewId('field', []),
        name: '',
        type: 'String',
        kind: 'scalar' as const,
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

  const deletePseudoStep = useCallback((stepId: string) => {
    const updatedSteps = pseudoSteps.filter(step => step.id !== stepId);
    setPseudoSteps(updatedSteps);
    onUpdate({ ...schedule, pseudoSteps: updatedSteps });
  }, [pseudoSteps, schedule, onUpdate]);

  const updateStepInputFields = useCallback((stepId: string, fields: StepField[]) => {
    updatePseudoStep(stepId, { inputFields: fields });
  }, [updatePseudoStep]);

  const updateStepOutputFields = useCallback((stepId: string, fields: StepField[]) => {
    updatePseudoStep(stepId, { outputFields: fields });
  }, [updatePseudoStep]);

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
          description: schedule.description || `Scheduled automation for ${schedule.name}`,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `Generate pseudo steps for ${schedule.name}. Make it comprehensive and realistic for scheduled business operations.`
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

  const generatePseudoSteps = useCallback(async () => {
    if (!schedule.name.trim()) {
      alert('Please enter a schedule name first to generate pseudo steps.');
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
          description: schedule.description || `Scheduled automation for ${schedule.name}`,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `This is a scheduled automation for ${schedule.name}. Make it comprehensive and realistic for automated business operations.`
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
      setIsGeneratingSteps(false);
    }
  }, [schedule, onUpdate, allModels]);

  const generateCode = useCallback(async () => {
    if (!schedule.name.trim()) {
      alert('Please enter a schedule name first.');
      return;
    }

    if (pseudoSteps.length === 0) {
      alert('Please add some pseudo steps first.');
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
          description: schedule.description || `Scheduled automation for ${schedule.name}`,
          pseudoSteps,
          availableModels: allModels,
          entityType: 'schedule',
          businessContext: `This is a scheduled automation for ${schedule.name}. Make it comprehensive and realistic for automated business operations.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExecuteCode(data.code || '');
        setEnvVars(data.envVars || []);
        
        onUpdate({
          ...schedule,
          execute: {
            ...schedule.execute,
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
  }, [schedule, pseudoSteps, onUpdate, allModels]);

  const runCode = useCallback(async (testMode: boolean) => {
    if (!executeCode) {
      alert('No code to execute. Please generate code first.');
      return;
    }

    if (!documentId) {
      alert('Document ID is required to execute schedule with real database records.');
      return;
    }

    // Validate inputs
    const inputParams = extractInputParameters();
    const requiredEnvVars = envVars.filter(e => e.required);
    const errors: string[] = [];
    
    inputParams.forEach(param => {
      if (param.required && !inputValues[param.name]) {
        errors.push(`Required input parameter "${param.name}" is missing`);
      }
    });

    requiredEnvVars.forEach(envVar => {
      if (!envVarValues[envVar.name]) {
        errors.push(`Required environment variable "${envVar.name}" is missing`);
      }
    });

    if (errors.length > 0) {
      alert(`Cannot execute schedule:\n${errors.join('\n')}`);
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
          interval: schedule.interval
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        const modeText = testMode ? 'test' : 'production';
        const dbUpdateText = result.databaseUpdated ? 'Database updated successfully!' : 'Database not modified (test mode)';
        const nextRunText = result.nextRun ? `\nNext run: ${new Date(result.nextRun).toLocaleString()}` : '';
        alert(`Schedule executed successfully in ${modeText} mode!\n\nExecution time: ${result.executionTime}ms\n${dbUpdateText}\n\nModels affected: ${result.modelsAffected?.map((m: any) => `${m.name} (${m.recordCount} records)`).join(', ') || 'None'}${nextRunText}`);
        
        // NOTE: Unlike SchedulesListEditor, we do NOT set the schedule as active here
        // This is test execution only, not activation
      } else {
        alert(`Schedule execution failed:\n${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error executing schedule:', error);
      alert('Error executing schedule. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }, [executeCode, documentId, extractInputParameters, envVars, inputValues, envVarValues, schedule.id, schedule.interval]);

  // Handle mode selection
  const handleModeSelection = useCallback((testMode: boolean) => {
    setExecutionMode(testMode ? 'test' : 'production');
    setShowRunModeModal(false);
    
    const inputParams = extractInputParameters();
    const requiredEnvVars = envVars.filter(e => e.required);
    
    // If no inputs required, execute directly
    if (inputParams.length === 0 && requiredEnvVars.length === 0) {
      runCode(testMode);
    } else {
      setShowInputDialog(true);
    }
  }, [extractInputParameters, envVars, runCode]);

  // Handle input dialog submit
  const handleInputDialogSubmit = useCallback(() => {
    const testMode = executionMode === 'test';
    setShowInputDialog(false);
    runCode(testMode);
  }, [executionMode, runCode]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <span className="text-orange-400 text-xl">⏰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-200 font-mono">Schedule Configuration</h3>
              <p className="text-orange-400 text-sm font-mono">Define automated schedules</p>
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

      {/* Section 1: Description */}
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
              placeholder="e.g., Daily Report, Weekly Cleanup"
              className="bg-black/50 border-cyan-500/30 text-cyan-100"
            />
          </div>

          <div>
            <Label htmlFor="schedule-description">Description</Label>
            <Textarea
              id="schedule-description"
              value={schedule.description}
              onChange={(e) => onUpdate({ ...schedule, description: e.target.value })}
              placeholder="Describe what this schedule does and its purpose..."
              className="bg-black/50 border-cyan-500/30 text-cyan-100 min-h-[100px]"
            />
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={generatePseudoStepsFromDescription}
              disabled={!schedule.name.trim() || !schedule.description.trim() || isGeneratingDescription}
              className="btn-matrix"
            >
              {isGeneratingDescription ? "Generating..." : "Generate Steps"}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 2: AI-Generated Pseudo Steps */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-orange-200 font-mono">2. AI-Generated Pseudo Steps</h4>
          <div className="flex gap-2">
            <Button
              onClick={addPseudoStep}
              className="btn-matrix px-4 py-2 text-sm font-mono"
            >
              <PlusIcon size={16} />
              <span className="ml-2">Add Step</span>
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
                  size="sm"
                >
                  <CrossIcon size={16} />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <StepFieldEditor
                    fields={step.inputFields || []}
                    onFieldsChange={(fields: StepField[]) => updateStepInputFields(step.id, fields)}
                    label="Input Fields"
                    color="orange"
                    allModels={allModels}
                  />
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
                className="btn-matrix"
              >
                {isGeneratingCode ? "Generating..." : "Generate Code"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Execute Code */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-orange-200 font-mono">3. Generated Executable Code</h4>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-orange-300 font-mono font-medium">Environment Variables</Label>
              <Button
                onClick={addEnvVar}
                className="btn-matrix px-4 py-2 text-sm font-mono"
              >
                <PlusIcon size={16} />
                <span className="ml-2">Add Env Var</span>
              </Button>
            </div>
            
            <div className="space-y-2">
              {envVars.map((envVar, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-lg bg-black/30 border border-orange-500/20">
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
                    size="sm"
                  >
                    <CrossIcon size={16} />
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
                            <div className="text-sm font-medium text-green-300 font-mono">
                              {model.name}
                            </div>
                            <div className="text-xs text-green-400/70 font-mono">
                              {model.recordCount} total records
                            </div>
                          </div>
                          {model.changes && model.changes.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-green-400/70 font-mono">Recent Changes:</div>
                              {model.changes.slice(0, 2).map((change: any, changeIndex: number) => (
                                <div key={changeIndex} className="text-xs font-mono text-green-200 bg-green-500/5 p-2 rounded border border-green-500/10">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                      change.operation === 'create' ? 'bg-blue-500/20 text-blue-300' :
                                      change.operation === 'update' ? 'bg-yellow-500/20 text-yellow-300' :
                                      change.operation === 'delete' ? 'bg-red-500/20 text-red-300' :
                                      'bg-gray-500/20 text-gray-300'
                                    }`}>
                                      {change.operation?.toUpperCase()}
                                    </span>
                                    {change.recordId && (
                                      <span className="text-green-400/70">ID: {change.recordId}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {model.changes.length > 2 && (
                                <div className="text-xs text-green-400/70 font-mono text-center py-1">
                                  ... and {model.changes.length - 2} more changes
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {executionResult.nextRun && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-orange-400 font-mono">⏰ Next Scheduled Run</div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="text-sm text-orange-200 font-mono">
                        {new Date(executionResult.nextRun).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {executionResult.result && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-orange-400 font-mono">💾 Execution Result</div>
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

          {(executeCode) && (
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
                className="btn-matrix px-6 py-2"
              >
                {isExecuting ? 'Running...' : 'Run'}
              </Button>
            </div>
          )}

          {/* Show helpful message when no code is available */}
          {!executeCode && (
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

      {/* Section 4: Execution Time (Schedule Only) */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-orange-200 font-mono">4. Execution Interval</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor={`schedule-interval-${schedule.id}`} className="text-orange-300 font-mono font-medium">Run Every</Label>
            <Select
              value={schedule.interval.pattern}
              onValueChange={(value) => onUpdate({ 
                ...schedule, 
                interval: { ...schedule.interval, pattern: value }
              })}
            >
              <SelectTrigger className="bg-black/50 border-orange-500/30 text-orange-200 focus:border-orange-400 focus:ring-orange-400/20 font-mono">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent className="bg-black border-orange-500/30">
                <SelectItem value="*/10 * * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">10 minutes</SelectItem>
                <SelectItem value="*/30 * * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">30 minutes</SelectItem>
                <SelectItem value="0 * * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">1 hour</SelectItem>
                <SelectItem value="0 */6 * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">6 hours</SelectItem>
                <SelectItem value="0 */12 * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">12 hours</SelectItem>
                <SelectItem value="0 0 * * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">1 day</SelectItem>
                <SelectItem value="0 0 */3 * *" className="text-orange-200 focus:bg-orange-500/20 font-mono">3 days</SelectItem>
                <SelectItem value="0 0 * * 0" className="text-orange-200 focus:bg-orange-500/20 font-mono">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-orange-300 font-mono font-medium">Status & Readiness</Label>
            <div className="space-y-4">
              {/* Readiness indicators */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs font-mono rounded border ${
                  isScheduleReady().ready 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                }`}>
                  {isScheduleReady().ready ? '✅ Ready' : '⚠️ Needs Setup'}
                </span>
                <span className={`px-2 py-1 text-xs font-mono rounded border ${
                  schedule.interval.active 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {schedule.interval.active ? 'Active' : 'Paused'}
                </span>
                {/* Saved input data indicator */}
                {schedule.savedInputs && (
                  <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    💾 Input Saved
                  </span>
                )}
              </div>

              {/* Show issues if not ready */}
              {!isScheduleReady().ready && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-sm font-medium text-yellow-300 font-mono mb-2">⚠️ Issues to resolve:</div>
                  <ul className="text-xs text-yellow-400/70 font-mono space-y-1">
                    {isScheduleReady().issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {/* Show pause button only if active AND ready */}
                {schedule.interval.active && isScheduleReady().ready && (
                  <Button
                    onClick={() => {
                      onUpdate({ 
                        ...schedule, 
                        interval: { ...schedule.interval, active: false }
                      });
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 font-mono px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span>⏸️</span>
                      <span className="text-sm">Pause Schedule</span>
                    </div>
                  </Button>
                )}
                
                {/* Show activate button when not active */}
                {!schedule.interval.active && (
                  <Button
                    onClick={() => {
                      if (isScheduleReady().ready) {
                        // Activate the schedule
                        onUpdate({ 
                          ...schedule, 
                          interval: { ...schedule.interval, active: true }
                        });
                      } else {
                        // Show issues - user needs to complete setup
                        alert(`Cannot activate schedule. Please resolve these issues:\n${isScheduleReady().issues.join('\n')}`);
                      }
                    }}
                    className={`font-mono px-4 py-2 ${
                      isScheduleReady().ready 
                        ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
                    }`}
                    title={isScheduleReady().ready ? "Activate this schedule" : "Complete setup to activate"}
                  >
                    <div className="flex items-center gap-2">
                      <span>{isScheduleReady().ready ? "▶️" : "⚙️"}</span>
                      <span className="text-sm">{isScheduleReady().ready ? "Activate Schedule" : "Complete Setup"}</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-black/30 border border-orange-500/20">
          <h5 className="text-orange-200 font-mono font-medium mb-2">Interval Options:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono text-orange-300">
            <div>• <strong>10/30 minutes</strong> - For frequent monitoring</div>
            <div>• <strong>1/6/12 hours</strong> - For regular processing</div>
            <div>• <strong>1/3 days</strong> - For periodic maintenance</div>
            <div>• <strong>1 week</strong> - For weekly reports</div>
          </div>
        </div>
      </div>

      {/* Section 5: Default Input Values */}
      <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-orange-200 font-mono">5. Default Input Values</h4>
        </div>
        
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-black/20 border border-orange-500/10">
            <p className="text-orange-400 text-sm font-mono mb-4">
              Configure the default input values that will be used when this schedule runs automatically. 
              These values are based on the input parameters defined in Step 1.
            </p>
          </div>

          {extractInputParameters().length > 0 ? (
            <div className="space-y-4">
              <h5 className="text-orange-300 font-mono font-medium">Input Parameters</h5>
              {extractInputParameters().map((param: InputParameter, index: number) => (
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
                      <Input
                        type={param.type === 'Int' || param.type === 'Float' ? 'number' : 
                              param.type === 'DateTime' ? 'datetime-local' : 'text'}
                        value={schedule.savedInputs?.inputParameters?.[param.name] || ''}
                        onChange={(e) => {
                          let processedValue: any = e.target.value;
                          if (param.type === 'Int') {
                            processedValue = parseInt(e.target.value) || 0;
                          } else if (param.type === 'Float') {
                            processedValue = parseFloat(e.target.value) || 0;
                          }
                          
                          const updatedSavedInputs = {
                            ...schedule.savedInputs,
                            inputParameters: {
                              ...schedule.savedInputs?.inputParameters,
                              [param.name]: processedValue
                            },
                            envVars: schedule.savedInputs?.envVars || {},
                            lastUpdated: new Date().toISOString()
                          };
                          
                          onUpdate({ 
                            ...schedule, 
                            savedInputs: updatedSavedInputs 
                          });
                        }}
                        placeholder={param.description || `Enter ${param.name}`}
                        className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                      />
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
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="font-mono">No input parameters defined.</p>
              <p className="text-sm mt-2 font-mono">
                Add input fields to Step 1 to configure default values here.
              </p>
            </div>
          )}

          {envVars.filter(e => e.required).length > 0 && (
            <div className="space-y-4">
              <h5 className="text-orange-300 font-mono font-medium">Required Environment Variables</h5>
              {envVars.filter(e => e.required).map((envVar, index) => (
                <div key={index} className="p-4 rounded-lg bg-black/30 border border-orange-500/20">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-orange-300 font-mono text-sm font-semibold">
                        {envVar.name} {envVar.sensitive && <span className="text-yellow-400">(Sensitive)</span>}
                      </Label>
                      {envVar.description && (
                        <div className="text-xs text-orange-400/70 font-mono">
                          📝 {envVar.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        type={envVar.sensitive ? 'password' : 'text'}
                        value={schedule.savedInputs?.envVars?.[envVar.name] || ''}
                        onChange={(e) => {
                          const updatedSavedInputs = {
                            ...schedule.savedInputs,
                            inputParameters: schedule.savedInputs?.inputParameters || {},
                            envVars: {
                              ...schedule.savedInputs?.envVars,
                              [envVar.name]: e.target.value
                            },
                            lastUpdated: new Date().toISOString()
                          };
                          
                          onUpdate({ 
                            ...schedule, 
                            savedInputs: updatedSavedInputs 
                          });
                        }}
                        placeholder={envVar.description || `Enter ${envVar.name}`}
                        className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {schedule.savedInputs && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-300 text-sm font-mono">💾 Saved Input Data</span>
                </div>
              <div className="text-xs text-blue-400/70 font-mono">
                Last updated: {schedule.savedInputs.lastUpdated ? new Date(schedule.savedInputs.lastUpdated).toLocaleString() : 'Never'}
              </div>
              <div className="text-xs text-blue-400/70 font-mono mt-1">
                These values will be used automatically when the schedule runs.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run Mode Selection Modal */}
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
              {/* Test Mode Option */}
              <button
                onClick={() => {
                  setShowRunModeModal(false);
                  handleModeSelection(true);
                }}
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

              {/* Production Mode Option */}
              <button
                onClick={() => {
                  setShowRunModeModal(false);
                  handleModeSelection(false);
                }}
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
                className="px-4 py-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Dialog */}
      {showInputDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-orange-200 font-mono mb-4">
              Schedule Input Required
            </h3>
            
            <div className="space-y-6">
              {extractInputParameters().length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Input Parameters</h4>
                  <div className="space-y-4">
                    {extractInputParameters().map((param: InputParameter, index: number) => (
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
                            <Input
                              value={inputValues[param.name] || ''}
                              onChange={(e) => setInputValues({ ...inputValues, [param.name]: e.target.value })}
                              placeholder={param.description}
                              className="bg-black/50 border-orange-500/30 text-orange-200 placeholder-orange-500/50 focus:border-orange-400 focus:ring-orange-400/20 font-mono"
                            />
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

              {envVars.filter(e => e.required).length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Required Environment Variables</h4>
                  <div className="space-y-3">
                    {envVars.filter(e => e.required).map((envVar, index) => (
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
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInputDialogSubmit}
                className="btn-matrix px-4 py-2"
              >
                Execute ({executionMode === 'test' ? 'Test' : 'Production'})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 