import * as React from 'react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, PencilEditIcon } from '@/components/icons';
import { ScheduleEditor } from '../editors/ScheduleEditor';
import type { AgentSchedule, AgentModel, EnvVar } from '../../types';
import { generateNewId } from '../../utils';

interface SchedulesListEditorProps {
  schedules: AgentSchedule[];
  onUpdate: (schedules: AgentSchedule[]) => void;
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

export const SchedulesListEditor = memo(({
  schedules,
  onUpdate,
  allModels = [],
  documentId
}: SchedulesListEditorProps) => {
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [activatingScheduleId, setActivatingScheduleId] = useState<string | null>(null);
  const [showActivationModeModal, setShowActivationModeModal] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [executionMode, setExecutionMode] = useState<'test' | 'production'>('test');
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Extract input parameters from schedule's global inputs
  const extractInputParameters = useCallback((schedule: AgentSchedule): InputParameter[] => {
    if (!schedule.globalInputs) return [];
    
    // Convert global inputs to parameter format
    return Object.entries(schedule.globalInputs).map(([key, value]) => ({
      name: key,
      type: typeof value === 'string' ? 'String' : typeof value === 'number' ? 'Int' : 'String',
      required: false,
      description: `Global input: ${key}`,
      defaultValue: value,
      kind: 'scalar' as const
    }));
  }, []);

  // Check if schedule is ready to be activated
  const isScheduleReady = useCallback((schedule: AgentSchedule): { ready: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!schedule.name?.trim()) {
      issues.push('Schedule name is required');
    }
    
    if (!schedule.description?.trim()) {
      issues.push('Schedule description is required');
    }
    
    if (!schedule.steps || schedule.steps.length === 0) {
      issues.push('No actions in chain');
    }
    
    if (!schedule.trigger?.pattern && !schedule.trigger?.interval && !schedule.trigger?.date && schedule.trigger?.type !== 'manual') {
      issues.push('No execution trigger set');
    }

    // Check if required input parameters have values
    const inputParams = extractInputParameters(schedule);
    const requiredInputParams = inputParams.filter(param => param.required);
    
    if (requiredInputParams.length > 0) {
      // Check if we have saved input data
      const savedInputs = (schedule as any).savedInputs;
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
    const requiredEnvVars = schedule.execute?.code?.envVars?.filter(e => e.required) || [];
    
    if (requiredEnvVars.length > 0) {
      const savedInputs = (schedule as any).savedInputs;
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
  }, [extractInputParameters]);

  // Handle Activate button click with smart logic
  const handleActivateSchedule = useCallback((schedule: AgentSchedule) => {
    const readiness = isScheduleReady(schedule);
    
    if (!readiness.ready) {
      // Schedule not ready - open ScheduleEditor
      setEditingScheduleId(schedule.id);
      return;
    }
    
    // Schedule ready - start activation flow
    setActivatingScheduleId(schedule.id);
    setShowActivationModeModal(true);
    
    // Initialize input values with saved data if available, otherwise use defaults
    const inputParams = extractInputParameters(schedule);
    const initialInputValues: Record<string, any> = {};
    const initialEnvVarValues: Record<string, string> = {};
    
    // Check if we have saved input data from previous activation
    if ((schedule as any).savedInputs) {
      // Use saved input parameters
      Object.assign(initialInputValues, (schedule as any).savedInputs.inputParameters || {});
      // Use saved environment variables
      Object.assign(initialEnvVarValues, (schedule as any).savedInputs.envVars || {});
    } else {
      // Fall back to defaults for input parameters
      inputParams.forEach(param => {
        if (param.defaultValue !== undefined) {
          initialInputValues[param.name] = param.defaultValue;
        }
      });
    }
    
    setInputValues(initialInputValues);
    setEnvVarValues(initialEnvVarValues);
  }, [isScheduleReady, extractInputParameters]);

  // Execute schedule activation
  const executeSchedule = async (testMode: boolean) => {
    if (!activatingScheduleId) return;
    
    const schedule = schedules.find(s => s.id === activatingScheduleId);
    if (!schedule) return;

    if (!schedule.execute?.code?.script) {
      alert('No code to execute. Please generate code first.');
      return;
    }

    if (!documentId) {
      alert('Document ID is required to execute schedule with real database records.');
      return;
    }

    // Validate inputs
    const inputParams = extractInputParameters(schedule);
    const requiredEnvVars = schedule.execute?.code?.envVars?.filter(e => e.required) || [];
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
          code: schedule.execute.code.script,
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
        
        // If this was production mode and successful, mark schedule as active AND save input data
        if (!testMode) {
          const updatedSchedule = {
            ...schedule,
            interval: { ...schedule.interval, active: true },
            // Save the input data for future automatic executions
            savedInputs: {
              inputParameters: inputValues,
              envVars: envVarValues,
              lastUpdated: new Date().toISOString()
            }
          };
          onUpdate(schedules.map(s => s.id === schedule.id ? updatedSchedule : s));
        }
        
        // Close modals
        setShowInputDialog(false);
        setShowActivationModeModal(false);
        setActivatingScheduleId(null);
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

  // Handle activation mode selection
  const handleActivationModeSelection = useCallback((testMode: boolean) => {
    setExecutionMode(testMode ? 'test' : 'production');
    setShowActivationModeModal(false);
    
    if (!activatingScheduleId) return;
    
    const schedule = schedules.find(s => s.id === activatingScheduleId);
    if (!schedule) return;
    
    const inputParams = extractInputParameters(schedule);
    const requiredEnvVars = schedule.execute?.code?.envVars?.filter(e => e.required) || [];
    
    // If no inputs required, execute directly
    if (inputParams.length === 0 && requiredEnvVars.length === 0) {
      executeSchedule(testMode);
    } else {
      setShowInputDialog(true);
    }
  }, [activatingScheduleId, schedules, extractInputParameters, executeSchedule]);

  // Handle input dialog submit
  const handleInputDialogSubmit = useCallback(() => {
    if (!activatingScheduleId) return;
    
    const schedule = schedules.find(s => s.id === activatingScheduleId);
    if (!schedule) return;
    
    const testMode = executionMode === 'test';
    setShowInputDialog(false);
    executeSchedule(testMode);
  }, [activatingScheduleId, schedules, executionMode, executeSchedule]);

  const addSchedule = useCallback(() => {
    const newSchedule: AgentSchedule = {
      id: generateNewId('schedule', schedules),
      name: `Schedule${schedules.length + 1}`,
      emoji: '⏰',
      description: '',
      type: 'Create',
      role: 'member',
      interval: {
        pattern: '0 0 * * *',
        timezone: 'UTC',
        active: false
      },
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
      }
    };
    onUpdate([...schedules, newSchedule]);
    setEditingScheduleId(newSchedule.id);
  }, [schedules, onUpdate]);

  const updateSchedule = useCallback((scheduleId: string, updatedSchedule: AgentSchedule) => {
    onUpdate(schedules.map(schedule => schedule.id === scheduleId ? updatedSchedule : schedule));
  }, [schedules, onUpdate]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const scheduleName = schedule?.name || 'this schedule';
    
    if (window.confirm(`Are you sure you want to delete schedule "${scheduleName}"? This action cannot be undone.`)) {
      onUpdate(schedules.filter(schedule => schedule.id !== scheduleId));
      if (editingScheduleId === scheduleId) {
        setEditingScheduleId(null);
      }
    }
  }, [schedules, onUpdate, editingScheduleId]);

  // If editing a schedule, show the editor
  if (editingScheduleId && schedules.find(s => s.id === editingScheduleId)) {
    const editingSchedule = schedules.find(s => s.id === editingScheduleId)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            onClick={() => setEditingScheduleId(null)}
            className="btn-matrix px-4 py-2 mr-4"
          >
            ← Back
          </Button>
          <h3 className="text-2xl font-bold text-green-200 font-mono">Editing Schedule: {editingSchedule.name}</h3>
        </div>
        <ScheduleEditor
          schedule={editingSchedule}
          onUpdate={(updatedSchedule) => updateSchedule(editingSchedule.id, updatedSchedule)}
          onDelete={() => deleteSchedule(editingSchedule.id)}
          allModels={allModels}
          documentId={documentId}
        />
      </div>
    );
  }

  // Get activating schedule for modals
  const activatingSchedule = activatingScheduleId ? schedules.find(s => s.id === activatingScheduleId) : null;
  const activatingScheduleInputParams = activatingSchedule ? extractInputParameters(activatingSchedule) : [];
  const activatingScheduleEnvVars = activatingSchedule?.execute?.code?.envVars || [];

  // Show list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Scheduled Automation</h3>
          <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
            <span className="text-green-300 text-sm font-medium font-mono">{schedules.length} schedules</span>
          </div>
        </div>
        <Button 
          onClick={addSchedule}
          className="btn-matrix px-3 sm:px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Add Schedule</span>
          </div>
        </Button>
      </div>

      {/* Schedules List */}
      <div className="grid gap-4">
        {schedules.map((schedule) => {
          const readiness = isScheduleReady(schedule);
          
          return (
            <div key={schedule.id} className="p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                    <span className="text-lg sm:text-xl">{schedule.emoji || '⏰'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono break-words">{schedule.name || 'Unnamed Schedule'}</h4>
                    <p className="text-green-400 text-xs sm:text-sm font-mono mb-2">
                      {schedule.steps?.length || 0} actions • {schedule.trigger?.pattern || schedule.trigger?.type || 'No trigger'} • {schedule.trigger?.active ? 'Active' : 'Inactive'}
                    </p>
                    {schedule.description && (
                      <p className="text-green-300/80 text-xs sm:text-sm font-mono leading-relaxed">
                        {schedule.description.length > 100 
                          ? `${schedule.description.substring(0, 100)}...` 
                          : schedule.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                        Target: {schedule.results?.model || 'Not set'}
                      </span>
                      <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                        Source: {schedule.dataSource?.type || 'Not set'}
                      </span>
                      {/* Readiness indicator */}
                      <span className={`px-2 py-1 text-xs font-mono rounded border ${
                        readiness.ready 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }`}>
                        {readiness.ready ? '✅ Ready' : '⚠️ Needs Setup'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-mono rounded border ${
                        schedule.interval.active 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {schedule.interval.active ? 'Active' : 'Paused'}
                      </span>
                      {/* Saved input data indicator */}
                      {(schedule as any).savedInputs && (
                        <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                          💾 Input Saved
                        </span>
                      )}
                    </div>
                    {/* Show issues if not ready */}
                    {!readiness.ready && (
                      <div className="mt-2 text-xs text-yellow-400/70 font-mono">
                        Issues: {readiness.issues.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingScheduleId(schedule.id)}
                      className="btn-matrix px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <PencilEditIcon size={14} />
                        <span className="text-xs sm:text-sm">Edit</span>
                      </div>
                    </Button>
                    
                    {/* Show pause button only if active AND ready */}
                    {schedule.interval.active && readiness.ready && (
                      <Button
                        onClick={() => {
                          // Simple pause - just toggle active flag
                          const updatedSchedule = {
                            ...schedule,
                            interval: { ...schedule.interval, active: false }
                          };
                          updateSchedule(schedule.id, updatedSchedule);
                        }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 font-mono px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                      >
                        <div className="flex items-center gap-2 justify-center">
                          <span>⏸️</span>
                          <span className="text-xs sm:text-sm">Pause</span>
                        </div>
                      </Button>
                    )}
                    
                    {/* Show activate button when not active */}
                    {!schedule.interval.active && (
                      <Button
                        onClick={() => handleActivateSchedule(schedule)}
                        className={`font-mono px-3 sm:px-4 py-2 flex-1 sm:flex-initial ${
                          readiness.ready 
                            ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
                        }`}
                        title={readiness.ready ? "Activate this schedule" : "Complete setup to activate"}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          <span>{readiness.ready ? "▶️" : "⚙️"}</span>
                          <span className="text-xs sm:text-sm">{readiness.ready ? "Activate" : "Setup"}</span>
                        </div>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-purple-800/30 flex items-center justify-center border border-purple-500/20">
              <span className="text-3xl sm:text-4xl">⏰</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Schedules Defined</h4>
            <p className="text-green-500 text-sm font-mono mb-4 sm:mb-6 px-4">Create scheduled tasks for your agent</p>
            <Button 
              onClick={addSchedule}
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

      {/* Activation Mode Modal */}
      {showActivationModeModal && activatingSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-orange-200 font-mono mb-4">
              Choose Activation Mode
            </h3>
            
            <p className="text-orange-400 text-sm font-mono mb-6">
              Select how you want to activate "{activatingSchedule.name}":
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleActivationModeSelection(true)}
                className="w-full p-4 text-left rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 text-lg">🧪</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-300 font-mono font-semibold">Test Mode</h4>
                    <p className="text-yellow-400/70 text-sm font-mono">Test schedule without activating</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleActivationModeSelection(false)}
                className="w-full p-4 text-left rounded-lg border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-lg">🚀</span>
                  </div>
                  <div>
                    <h4 className="text-green-300 font-mono font-semibold">Production Mode</h4>
                    <p className="text-green-400/70 text-sm font-mono">Activate schedule with real execution</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowActivationModeModal(false);
                  setActivatingScheduleId(null);
                }}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Dialog Modal */}
      {showInputDialog && activatingSchedule && (activatingScheduleInputParams.length > 0 || activatingScheduleEnvVars.filter(e => e.required).length > 0) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-orange-200 font-mono mb-4">
              Schedule Input Required
            </h3>
            
            <p className="text-orange-400 text-sm font-mono mb-6">
              Provide input for "{activatingSchedule.name}":
              {(activatingSchedule as any).savedInputs && (
                <span className="block mt-1 text-blue-300 text-xs">
                  💾 Using saved input data from {new Date((activatingSchedule as any).savedInputs.lastUpdated).toLocaleDateString()}
                </span>
              )}
            </p>
            
            <div className="space-y-6">
              {activatingScheduleInputParams.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Input Parameters</h4>
                  <div className="space-y-4">
                    {activatingScheduleInputParams.map((param: InputParameter, index: number) => (
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
                              value={inputValues[param.name] || ''}
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

              {activatingScheduleEnvVars.filter(e => e.required).length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-orange-300 font-mono mb-3">Required Environment Variables</h4>
                  <div className="space-y-3">
                    {activatingScheduleEnvVars.filter(e => e.required).map((envVar, index) => (
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
                disabled={isExecuting}
              >
                {isExecuting ? 'Processing...' : `Activate (${executionMode === 'test' ? 'Test' : 'Production'})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 