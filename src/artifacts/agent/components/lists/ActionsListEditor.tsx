import * as React from 'react';
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, PencilEditIcon } from '@/components/icons';
import { ActionEditor } from '../editors/ActionEditor';
import type { AgentAction, AgentModel } from '../../types';
import { generateNewId } from '../../utils';

interface ActionsListEditorProps {
  actions: AgentAction[];
  onUpdate: (actions: AgentAction[]) => void;
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

export const ActionsListEditor = memo(({
  actions,
  onUpdate,
  allModels = [],
  documentId
}: ActionsListEditorProps) => {
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [showRunModeModal, setShowRunModeModal] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [executionMode, setExecutionMode] = useState<'test' | 'production'>('test');
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Check if action is ready to run
  const isActionReady = useCallback((action: AgentAction): { ready: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!action.name?.trim()) {
      issues.push('Action name is required');
    }
    
    if (!action.description?.trim()) {
      issues.push('Action description is required');
    }
    
    if (!action.execute?.code?.script?.trim()) {
      issues.push('No executable code generated');
    }
    
    if (!action.pseudoSteps || action.pseudoSteps.length === 0) {
      issues.push('No pseudo steps defined');
    }
    
    return {
      ready: issues.length === 0,
      issues
    };
  }, []);

  // Extract input parameters from action's first step
  const extractInputParameters = useCallback((action: AgentAction): InputParameter[] => {
    if (!action.pseudoSteps || action.pseudoSteps.length === 0) return [];
    
    const firstStep = action.pseudoSteps[0];
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
  }, []);

  // Handle Run button click with smart logic
  const handleRunAction = useCallback((action: AgentAction) => {
    const readiness = isActionReady(action);
    
    if (!readiness.ready) {
      // Action not ready - open ActionEditor
      setEditingActionId(action.id);
      return;
    }
    
    // Action ready - start run flow
    setRunningActionId(action.id);
    setShowRunModeModal(true);
    
    // Initialize input values with defaults
    const inputParams = extractInputParameters(action);
    const initialInputValues: Record<string, any> = {};
    inputParams.forEach(param => {
      if (param.defaultValue !== undefined) {
        initialInputValues[param.name] = param.defaultValue;
      }
    });
    setInputValues(initialInputValues);
  }, [isActionReady, extractInputParameters]);

  // Execute action
  const executeAction = useCallback(async (action: AgentAction, testMode: boolean) => {
    if (!action.execute?.code?.script) {
      alert('No code to execute. Please generate code first.');
      return;
    }

    if (!documentId) {
      alert('Document ID is required to execute action with real database records.');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/agent/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          code: action.execute.code.script,
          inputParameters: inputValues,
          envVars: envVarValues,
          testMode
        }),
      });

      const result = await response.json();
      setExecutionResult(result);

      if (result.success) {
        const modeText = testMode ? 'test' : 'production';
        const dbUpdateText = result.databaseUpdated ? 'Database updated successfully!' : 'Database not modified (test mode)';
        alert(`Action executed successfully in ${modeText} mode!\n\nExecution time: ${result.executionTime}ms\n${dbUpdateText}\n\nModels affected: ${result.modelsAffected?.map((m: any) => `${m.name} (${m.recordCount} records)`).join(', ') || 'None'}`);
        
        // Close modals
        setShowInputDialog(false);
        setShowRunModeModal(false);
        setRunningActionId(null);
      } else {
        alert(`Action execution failed:\n${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Error executing action. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }, [documentId, inputValues, envVarValues]);

  // Handle run mode selection
  const handleRunModeSelection = useCallback((testMode: boolean) => {
    setExecutionMode(testMode ? 'test' : 'production');
    setShowRunModeModal(false);
    setShowInputDialog(true);
  }, []);

  // Handle input dialog submit
  const handleInputDialogSubmit = useCallback(() => {
    if (!runningActionId) return;
    
    const action = actions.find(a => a.id === runningActionId);
    if (!action) return;
    
    const testMode = executionMode === 'test';
    setShowInputDialog(false);
    executeAction(action, testMode);
  }, [runningActionId, actions, executionMode, executeAction]);

  // Render parameter input for the input dialog
  const renderParameterInput = useCallback((param: InputParameter) => {
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

    // Handle scalar fields based on type
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
  }, [inputValues, allModels]);

  const addAction = useCallback(() => {
    const newAction: AgentAction = {
      id: generateNewId('action', actions),
      name: `Action${actions.length + 1}`,
      emoji: '⚡',
      description: '',
      role: 'member',
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
    onUpdate([...actions, newAction]);
    setEditingActionId(newAction.id);
  }, [actions, onUpdate]);

  const updateAction = useCallback((actionId: string, updatedAction: AgentAction) => {
    onUpdate(actions.map(action => action.id === actionId ? updatedAction : action));
  }, [actions, onUpdate]);

  const deleteAction = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    const actionName = action?.name || 'this action';
    
    if (window.confirm(`Are you sure you want to delete action "${actionName}"? This action cannot be undone.`)) {
      onUpdate(actions.filter(action => action.id !== actionId));
      if (editingActionId === actionId) {
        setEditingActionId(null);
      }
    }
  }, [actions, onUpdate, editingActionId]);

  // Get running action data
  const runningAction = runningActionId ? actions.find(a => a.id === runningActionId) : null;
  const runningActionInputParams = runningAction ? extractInputParameters(runningAction) : [];
  const runningActionEnvVars = runningAction?.execute?.code?.envVars || [];

  // Auto-execute if no inputs required
  const shouldAutoExecute = showInputDialog && runningAction && runningActionInputParams.length === 0 && runningActionEnvVars.filter(e => e.required).length === 0;
  
  React.useEffect(() => {
    if (shouldAutoExecute) {
      handleInputDialogSubmit();
    }
  }, [shouldAutoExecute, handleInputDialogSubmit]);

  // If editing an action, show the editor
  if (editingActionId && actions.find(a => a.id === editingActionId)) {
    const editingAction = actions.find(a => a.id === editingActionId)!;
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            onClick={() => setEditingActionId(null)}
            className="btn-matrix px-4 py-2 mr-4"
          >
            ← Back
          </Button>
          <h3 className="text-2xl font-bold text-green-200 font-mono">Editing Action: {editingAction.name}</h3>
        </div>
        <ActionEditor
          action={editingAction}
          onUpdate={(updatedAction) => updateAction(editingAction.id, updatedAction)}
          onDelete={() => deleteAction(editingAction.id)}
          onGoBack={() => setEditingActionId(null)}
          allModels={allModels}
          documentId={documentId}
        />
      </div>
    );
  }

  // Show list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-green-200 font-mono">Automated Actions</h3>
          <div className="px-3 py-1 rounded-lg bg-green-800/50 border border-green-700">
            <span className="text-green-300 text-sm font-medium font-mono">{actions.length} actions</span>
          </div>
        </div>
        <Button 
          onClick={addAction}
          className="btn-matrix px-3 sm:px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <PlusIcon size={16} />
            <span>Add Action</span>
          </div>
        </Button>
      </div>

      {/* Actions List */}
      <div className="grid gap-4">
        {actions.map((action) => {
          const readiness = isActionReady(action);
          
          return (
            <div key={action.id} className="p-4 sm:p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-colors">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <span className="text-lg sm:text-xl">{action.emoji || '⚡'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-green-200 font-mono break-words">{action.name || 'Unnamed Action'}</h4>
                    <p className="text-green-400 text-xs sm:text-sm font-mono mb-2">
                      {action.role} • {action.execute?.type || 'Not configured'} • {action.results?.actionType || 'Not configured'}
                    </p>
                    {action.description && (
                      <p className="text-green-300/80 text-xs sm:text-sm font-mono leading-relaxed">
                        {action.description.length > 100 
                          ? `${action.description.substring(0, 100)}...` 
                          : action.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                        Target: {action.results?.model || 'Not set'}
                      </span>
                      <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                        Source: {action.dataSource?.type || 'Not configured'}
                      </span>
                      {/* Readiness indicator */}
                      <span className={`px-2 py-1 text-xs font-mono rounded border ${
                        readiness.ready 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }`}>
                        {readiness.ready ? '✅ Ready' : '⚠️ Needs Setup'}
                      </span>
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
                      onClick={() => setEditingActionId(action.id)}
                      className="btn-matrix px-3 sm:px-4 py-2 flex-1 sm:flex-initial"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <PencilEditIcon size={14} />
                        <span className="text-xs sm:text-sm">Edit Action</span>
                      </div>
                    </Button>
                    {readiness.ready && (
                      <Button
                        onClick={() => handleRunAction(action)}
                        className={`px-3 sm:px-4 py-2 flex-1 sm:flex-initial font-mono ${
                          readiness.ready
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'
                          : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30'
                      }`}
                      title={readiness.ready ? 'Run this action' : 'Complete setup to run this action'}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <span>{readiness.ready ? '▶️' : '⚙️'}</span>
                        <span className="text-xs sm:text-sm">
                          Run
                        </span>
                      </div>
                    </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {actions.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-blue-800/30 flex items-center justify-center border border-blue-500/20">
              <span className="text-3xl sm:text-4xl">⚡</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-green-300 mb-2 font-mono">No Actions Defined</h4>
            <p className="text-green-500 text-sm font-mono mb-4 sm:mb-6 px-4">Create automated actions for your agent to perform</p>
            <Button 
              onClick={addAction}
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

      {/* Run Mode Modal */}
      {showRunModeModal && runningAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-blue-200 font-mono mb-4">
              Choose Run Mode
            </h3>
            
            <p className="text-blue-400 text-sm font-mono mb-6">
              Select how you want to execute "{runningAction.name}":
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
                onClick={() => {
                  setShowRunModeModal(false);
                  setRunningActionId(null);
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
      {showInputDialog && runningAction && (runningActionInputParams.length > 0 || runningActionEnvVars.filter(e => e.required).length > 0) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-blue-200 font-mono mb-4">
              Action Input Required
            </h3>
            
            <p className="text-blue-400 text-sm font-mono mb-6">
              Provide input for "{runningAction.name}":
            </p>
            
            <div className="space-y-6">
              {runningActionInputParams.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-blue-300 font-mono mb-3">Input Parameters</h4>
                  <div className="space-y-4">
                    {runningActionInputParams.map((param: InputParameter, index: number) => (
                      <div key={index} className="p-4 rounded-lg bg-black/30 border border-blue-500/20">
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <Label className="text-blue-300 font-mono text-sm font-semibold">
                              {param.name} {param.required && <span className="text-red-400">*</span>}
                            </Label>
                            <div className="text-xs text-blue-400/70 font-mono">
                              Type: {param.type} 
                              {param.kind === 'object' && (
                                <span className="text-blue-400 ml-1">(Database Relation)</span>
                              )}
                              {param.list && <span className="text-blue-400 ml-1">[List]</span>}
                            </div>
                            {param.description && (
                              <div className="text-xs text-blue-400/70 font-mono">
                                📝 {param.description}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {renderParameterInput(param)}
                          </div>

                          {param.defaultValue && (
                            <div className="text-xs text-blue-400/70 font-mono">
                              Default: {typeof param.defaultValue === 'object' ? JSON.stringify(param.defaultValue) : param.defaultValue}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {runningActionEnvVars.filter(e => e.required).length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-blue-300 font-mono mb-3">Required Environment Variables</h4>
                  <div className="space-y-3">
                    {runningActionEnvVars.filter(e => e.required).map((envVar, index) => (
                      <div key={index} className="space-y-1">
                        <Label className="text-blue-300 font-mono text-sm">
                          {envVar.name} {envVar.sensitive && <span className="text-yellow-400">(Sensitive)</span>}
                        </Label>
                        <Input
                          type={envVar.sensitive ? 'password' : 'text'}
                          value={envVarValues[envVar.name] || ''}
                          onChange={(e) => setEnvVarValues(prev => ({ ...prev, [envVar.name]: e.target.value }))}
                          placeholder={envVar.description}
                          className="bg-black/50 border-blue-500/30 text-blue-200 placeholder-blue-500/50 focus:border-blue-400 focus:ring-blue-400/20 font-mono"
                        />
                        <p className="text-xs text-blue-400/70 font-mono">{envVar.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowInputDialog(false);
                  setRunningActionId(null);
                }}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInputDialogSubmit}
                disabled={isExecuting}
                className="btn-matrix px-4 py-2"
              >
                {isExecuting ? 'Executing...' : `Execute (${executionMode === 'test' ? 'Test' : 'Production'})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 