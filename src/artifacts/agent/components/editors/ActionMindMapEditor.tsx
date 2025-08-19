import * as React from 'react';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { CrossIcon, PlusIcon } from '@/components/icons';
import { StepFieldEditor } from './StepFieldEditor';
import { ModelExecutionChangesViewer } from './ModelExecutionChangesViewer';
import { AuthenticationStatus } from './AuthenticationStatus';
import type { AgentAction, EnvVar, PseudoCodeStep, StepField, AgentModel, UIComponent, TestCase } from '../../types';
import { getStepCategory, getStepCategoryInfo, getStepTypeDisplay } from '../../types/action';
import { generateNewId } from '../../utils';

interface InteractiveTestComponentsProps {
  steps: PseudoCodeStep[];
  components: UIComponent[];
  allModels: AgentModel[];
  onTestResult: (result: any) => void;
  isRunningTest: boolean;
  onRunTest: (inputParameters: any) => void;
  isLiveMode?: boolean;
  action?: AgentAction;
  documentId?: string;
}

const BusinessTestResults = ({ result, onShowDetails, isLiveMode = false }: { result: any; onShowDetails?: () => void; isLiveMode?: boolean }) => {
  if (!result) return null;

  const generateBusinessSummary = (result: any) => {
    const stepResults = result.stepResults || [];
    
    // Extract business metrics from step results
    const createdRecords = stepResults.filter((s: any) => s.result?.created || s.result?.record).length;
    const updatedRecords = stepResults.reduce((sum: number, s: any) => sum + (s.result?.affectedRecords || 0), 0);
    const foundRecords = stepResults.reduce((sum: number, s: any) => sum + (s.result?.count || (s.result?.record ? 1 : 0)), 0);
    const apiCalls = stepResults.filter((s: any) => s.type === 'call external api').length;
    const aiAnalyses = stepResults.filter((s: any) => s.type === 'ai analysis').length;

    return {
      createdRecords,
      updatedRecords,
      foundRecords,
      apiCalls,
      aiAnalyses,
      totalSteps: stepResults.length
    };
  };

  const businessMetrics = generateBusinessSummary(result);
  const isSuccess = result.success;

  return (
    <div className="space-y-4 w-full">
      {/* Success Banner */}
      <div className={`relative p-4 rounded-lg border w-full ${
        isSuccess 
          ? 'bg-emerald-500/10 border-emerald-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        {/* Quick Access Badge */}
        {isSuccess && onShowDetails && (
          <div 
            className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse cursor-pointer hover:bg-blue-600 transition-colors shadow-lg hover:scale-110"
            onClick={onShowDetails}
            title="Click for detailed execution log"
          >
            📊 DETAILS
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className={`text-2xl ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
            {isSuccess ? '✅' : '❌'}
          </div>
          <div className="flex-1">
            <div className={`font-semibold text-sm ${isSuccess ? 'text-emerald-200' : 'text-red-200'}`}>
              {isSuccess ? (isLiveMode ? 'Live Execution Successful!' : 'Test Successful!') : (isLiveMode ? 'Live Execution Failed' : 'Test Failed')}
            </div>
            <div className={`text-xs ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.finalResult}
            </div>
          </div>
        </div>

                 {/* Business Metrics Grid */}
         {isSuccess && (
           <div className="grid grid-cols-3 gap-3 mt-4">
             {businessMetrics.createdRecords > 0 && (
               <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-center">
                 <div className="text-emerald-400 text-xl font-bold">{businessMetrics.createdRecords}</div>
                 <div className="text-emerald-300 text-xs font-medium">Created</div>
               </div>
             )}
             {businessMetrics.updatedRecords > 0 && (
               <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 text-center">
                 <div className="text-blue-400 text-xl font-bold">{businessMetrics.updatedRecords}</div>
                 <div className="text-blue-300 text-xs font-medium">Updated</div>
               </div>
             )}
             {businessMetrics.foundRecords > 0 && (
               <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 text-center">
                 <div className="text-yellow-400 text-xl font-bold">{businessMetrics.foundRecords}</div>
                 <div className="text-yellow-300 text-xs font-medium">Found</div>
               </div>
             )}
           </div>
         )}

                 {/* Performance Summary */}
        <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-emerald-500/10">
          <div className="flex items-center gap-1 text-emerald-300 text-xs">
            <span>⚡</span>
            <span>{result.executionTime}ms</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-300 text-xs">
            <span>📊</span>
            <span>{businessMetrics.totalSteps} steps</span>
          </div>
          {businessMetrics.aiAnalyses > 0 && (
            <div className="flex items-center gap-1 text-emerald-300 text-xs">
              <span>🤖</span>
              <span>{businessMetrics.aiAnalyses} AI</span>
            </div>
          )}
        </div>

        {/* Real Code Testing Summary */}
        {result.realCodeTesting && result.summary && (
          <div className="mt-4 pt-3 border-t border-emerald-500/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-sm">🧪</span>
              <span className="text-emerald-300 text-sm font-medium">Real Code Testing</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10 text-center">
                <div className="text-emerald-400 text-lg font-bold">{result.summary.passedSteps}/{result.summary.totalSteps}</div>
                <div className="text-emerald-300 text-xs">Steps Passed</div>
              </div>
              <div className="bg-blue-500/5 p-2 rounded border border-blue-500/10 text-center">
                <div className="text-blue-400 text-lg font-bold">{Math.round(result.summary.successRate)}%</div>
                <div className="text-blue-300 text-xs">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Step Execution Logs (for both test and live modes) */}
        {((isLiveMode && result.stepExecutionLogs) || (!isLiveMode && result.stepResults)) && (
          <div className="mt-4 pt-3 border-t border-emerald-500/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-sm">📝</span>
              <span className="text-emerald-300 text-sm font-medium">
                {isLiveMode ? 'Live Action Execution Logs' : 'Test Step Execution Logs'}
              </span>
            </div>
            <div className="bg-black/20 rounded p-2 max-h-32 overflow-y-auto">
              {isLiveMode ? (
                // Live mode: Show logger.info/error messages from action execution
                result.stepExecutionLogs?.map((log: any, index: number) => (
                  <div key={index} className={`text-xs font-mono ${log.level === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
                    [{log.step}] {log.message}
                  </div>
                ))
              ) : (
                // Test mode: Show step-by-step test results with log messages
                result.stepResults?.map((stepResult: any, index: number) => (
                  <div key={index} className={`text-xs font-mono ${stepResult.status === 'error' || stepResult.status === 'failed' ? 'text-red-300' : 'text-blue-300'}`}>
                    [Step {stepResult.stepNumber || index + 1}] {stepResult.logMessage || stepResult.description || `${stepResult.type} completed`}
                    {stepResult.status && (
                      <span className={`ml-2 px-1 rounded text-xs ${
                        stepResult.status === 'passed' || stepResult.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        stepResult.status === 'failed' || stepResult.status === 'error' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {stepResult.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
         

      </div>


    </div>
  );
};

// Helper functions for business-friendly descriptions
const getBusinessStepDescription = (step: any): string => {
  // Handle live mode operations (from changeLog)
  if (step.type === 'create') {
    return `Created new ${step.result?.model || 'record'}`;
  }
  if (step.type === 'update') {
    return `Updated ${step.result?.model || 'record'} data`;
  }
  if (step.type === 'findMany') {
    return `Retrieved ${step.result?.model || 'records'} from database`;
  }
  if (step.type === 'findUnique') {
    return `Found specific ${step.result?.model || 'record'}`;
  }
  if (step.type === 'delete') {
    return `Removed ${step.result?.model || 'record'} from database`;
  }

  // Handle test mode operations (pseudo steps)
  switch (step.type) {
    // Prisma Database Operations
    case 'findUnique':
    case 'findUniqueOrThrow':
    case 'findFirst':
    case 'findFirstOrThrow':
      return `Found the specific ${step.description?.toLowerCase() || 'record'}`;
    case 'findMany':
      return `Searched for ${step.description?.toLowerCase() || 'records'}`;
    case 'create':
    case 'createMany':
    case 'createManyAndReturn':
      return `Created new ${step.description?.toLowerCase() || 'record'}`;
    case 'update':
    case 'updateMany':
    case 'upsert':
      return `Updated ${step.description?.toLowerCase() || 'record'}`;
    case 'delete':
    case 'deleteMany':
      return `Removed ${step.description?.toLowerCase() || 'record'}`;
    case 'count':
      return `Counted ${step.description?.toLowerCase() || 'records'}`;
    case 'aggregate':
    case 'groupBy':
      return `Aggregated ${step.description?.toLowerCase() || 'data'}`;
    case '$transaction':
      return `Executed transaction for ${step.description?.toLowerCase() || 'operations'}`;
    case '$executeRaw':
    case '$queryRaw':
      return `Executed raw SQL for ${step.description?.toLowerCase() || 'data'}`;
    // External API Operations
    case 'api call get':
    case 'api call post':
    case 'api call put':
    case 'api call delete':
    case 'api call patch':
      return `Connected to external service for ${step.description?.toLowerCase() || 'data'}`;
    case 'graphql query':
    case 'graphql mutation':
    case 'graphql subscription':
      return `Executed GraphQL for ${step.description?.toLowerCase() || 'data'}`;
    // AI Operations
    case 'ai analysis':
      return `AI analyzed ${step.description?.toLowerCase() || 'data'}`;
    case 'ai generate object':
    case 'ai generate text':
    case 'ai generate image':
      return `AI generated ${step.description?.toLowerCase() || 'content'}`;
    // JavaScript Data Operations
    case 'map':
    case 'filter':
    case 'reduce':
    case 'find':
    case 'sort':
      return `Processed ${step.description?.toLowerCase() || 'data'} array`;
    case 'parse json':
    case 'stringify json':
      return `Converted ${step.description?.toLowerCase() || 'data'} format`;
    case 'validate data':
      return `Validated ${step.description?.toLowerCase() || 'data'}`;
    case 'transform data':
    case 'merge objects':
      return `Transformed ${step.description?.toLowerCase() || 'data'}`;
    default:
      return step.step || step.description || 'Operation completed';
  }
};

const getBusinessResultSummary = (result: any): string => {
  // Handle live mode results (actual database operations)
  if (result.operation) {
    if (result.operation === 'create' && result.created) {
      return `Created ${result.created} ${result.model || 'record'}(s)`;
    }
    if (result.operation === 'update' && result.updated) {
      return `Updated ${result.updated} ${result.model || 'record'}(s)`;
    }
    if (result.operation === 'findMany' && result.found) {
      return `Found ${result.found} ${result.model || 'record'}(s)`;
    }
    if (result.operation === 'findUnique' && result.found) {
      return `Located specific ${result.model || 'record'}`;
    }
    if (result.operation === 'delete' && result.affectedRecords) {
      return `Deleted ${result.affectedRecords} ${result.model || 'record'}(s)`;
    }
  }

  // Handle test mode results (mock data)
  if (result.created && result.record) {
    return `Created record with ID: ${result.record.id}`;
  }
  if (result.count) {
    return `Found ${result.count} matching records`;
  }
  if (result.updated) {
    return `Updated ${result.affectedRecords || result.updated} record(s)`;
  }
  if (result.deleted) {
    return `Removed ${result.affectedRecords} record(s)`;
  }
  if (result.found) {
    return `Located ${result.found} record(s)`;
  }
  if (result.apiResponse?.status === 'success') {
    return `External service responded successfully`;
  }
  if (result.analysis) {
    return `Analysis completed with ${Math.round((result.confidence || 0.8) * 100)}% confidence`;
  }
  return result.message || 'Operation completed';
};

const InteractiveTestComponents = ({ steps, components, allModels, onTestResult, isRunningTest, onRunTest, isLiveMode = false, action, documentId }: InteractiveTestComponentsProps) => {
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});

  // Initialize testInputs with default values when components change
  React.useEffect(() => {
    const defaultInputs: Record<string, any> = {};
    components.forEach(component => {
      if (component.defaultValue !== undefined) {
        defaultInputs[component.name] = component.defaultValue;
      } else if (component.type === 'checkbox') {
        // For checkboxes, always set an initial boolean value
        defaultInputs[component.name] = false;
      } else if (component.type === 'select' && component.options && component.options.length > 0) {
        // For selects, use first option if no default
        defaultInputs[component.name] = component.options[0].value;
      }
    });
    
    // Always initialize with defaults, even if testInputs already has values
    if (Object.keys(defaultInputs).length > 0) {
      setTestInputs(defaultInputs);
    }
  }, [components]);

  // Helper function to get the effective value for a component (including defaults)
  const getEffectiveValue = (component: any) => {
    const inputValue = testInputs[component.name];
    
    // Since we now initialize all values, we should have them in state
    if (inputValue !== undefined) {
      return inputValue;
    }
    
    // Fallback to default value if somehow not in state
    if (component.type === 'checkbox') {
      return component.defaultValue !== undefined ? component.defaultValue : false;
    }
    
    return component.defaultValue || '';
  };

  // Helper function to check if a required field is properly filled
  const isFieldValid = (component: any) => {
    if (!component.required) return true;
    
    const effectiveValue = getEffectiveValue(component);
    
    // For boolean/checkbox fields, any boolean value (including false) is valid
    if (component.type === 'checkbox') {
      return typeof effectiveValue === 'boolean';
    }
    
    // For select fields, check if a value is selected
    if (component.type === 'select') {
      return effectiveValue !== undefined && effectiveValue !== null && effectiveValue !== '';
    }
    
    // For other fields, check if value exists and is not empty
    return effectiveValue !== undefined && effectiveValue !== null && String(effectiveValue).trim() !== '';
  };

  // Check if all required fields are valid
  const allRequiredFieldsValid = components.filter(c => c.required).every(c => isFieldValid(c));



  const handleRunTest = () => {
    // Since we now properly initialize testInputs with defaults, we can use it directly
    // But let's ensure we include any missing defaults just in case
    const effectiveInputs: Record<string, any> = { ...testInputs };
    components.forEach(component => {
      if (!(component.name in effectiveInputs)) {
        effectiveInputs[component.name] = getEffectiveValue(component);
      }
    });
    onRunTest(effectiveInputs);
  };

  // Check if this action needs user inputs or can run automatically
  const needsUserInput = steps[0]?.inputFields?.some((field: any) => 
    field.required && !field.defaultValue && field.name !== 'id'
  );

  // If no UI components generated but no input needed, show simple test button
  if (!components || components.length === 0) {
    if (!needsUserInput) {
      return (
        <div className="space-y-4">
          <div className={`font-mono text-sm font-semibold ${isLiveMode ? 'text-emerald-300' : 'text-blue-300'}`}>
            {isLiveMode ? '🚀 Run Your Live Action' : '🧪 Test Your Action'}
          </div>
          
          {/* Authentication Status for Live Mode */}
          {isLiveMode && action && (
            <AuthenticationStatus 
              documentId={documentId} 
              action={action}
            />
          )}
          
          <div className={`font-mono text-xs text-center mb-4 ${isLiveMode ? 'text-emerald-400/70' : 'text-blue-400/70'}`}>
            This action doesn't require user inputs. Click below to {isLiveMode ? 'run it with real data' : 'test it with mock data'}.
          </div>
                                <Button
            onClick={handleRunTest}
            disabled={isRunningTest}
            className="btn-matrix w-full text-sm px-4 py-3 min-h-[44px] flex items-center justify-center"
          >
                    <span className="truncate font-medium">
          {isRunningTest ? 
            (isLiveMode ? "🚀 Running Live..." : "🧪 Testing...") : 
            (isLiveMode ? "🚀 Run Live Action" : "🧪 Test Action")
          }
        </span>
          </Button>
        </div>
      );
    }
    
          return (
        <div className={`font-mono text-xs text-center p-4 ${isLiveMode ? 'text-emerald-300' : 'text-blue-300'}`}>
          {isLiveMode ? 
            'This live action is ready to run without a custom interface.' :
            'No UI components generated yet. Generate UI components to run this action.'
          }
        </div>
      );
  }

  return (
    <div className="space-y-4">
      <div className={`font-mono text-sm font-semibold ${isLiveMode ? 'text-emerald-300' : 'text-blue-300'}`}>
        {isLiveMode ? '🚀 Live Action Interface' : '🧪 Test Action Interface'}
      </div>
      
      {/* Authentication Status for Live Mode */}
      {isLiveMode && action && (
        <AuthenticationStatus 
          documentId={documentId} 
          action={action}
        />
      )}

      {/* Action Input Fields (from Step 1) */}
      {action && action.pseudoSteps && action.pseudoSteps.length > 0 && action.pseudoSteps[0].inputFields && action.pseudoSteps[0].inputFields.length > 0 && (
        <div className={`p-4 rounded-lg border ${isLiveMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={isLiveMode ? 'text-emerald-400' : 'text-blue-400'}>📝</span>
            <span className={`font-medium ${isLiveMode ? 'text-emerald-300' : 'text-blue-300'}`}>Action Input Fields</span>
          </div>
          <div className="space-y-3">
            {action.pseudoSteps[0].inputFields.map((field, index) => (
              <div key={index} className={`bg-black/20 p-3 rounded border ${isLiveMode ? 'border-emerald-500/10' : 'border-blue-500/10'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium text-sm ${isLiveMode ? 'text-emerald-300' : 'text-blue-300'}`}>{field.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${isLiveMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-red-400 text-xs">Required</span>
                    )}
                  </div>
                </div>
                {field.description && (
                  <p className={`text-xs opacity-80 mb-2 ${isLiveMode ? 'text-emerald-200' : 'text-blue-200'}`}>{field.description}</p>
                )}
                <input
                  type="text"
                  placeholder={`Enter ${field.name}...`}
                  className={`w-full bg-black/30 border rounded px-3 py-2 text-sm focus:outline-none ${
                    isLiveMode 
                      ? 'border-emerald-500/20 text-emerald-200 placeholder-emerald-400/50 focus:border-emerald-400' 
                      : 'border-blue-500/20 text-blue-200 placeholder-blue-400/50 focus:border-blue-400'
                  }`}
                  onChange={(e) => {
                    // Store input values in a way that doesn't modify the field object
                    // This will be handled by the existing component value tracking system
                    const inputEvent = new CustomEvent('fieldValueChange', {
                      detail: { fieldName: field.name, value: e.target.value }
                    });
                    e.target.dispatchEvent(inputEvent);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Render AI-generated UI components */}
      {components.map(component => (
        <div key={component.id} className="space-y-2">
          <Label className="text-blue-300 font-mono text-xs">
            {component.label}
            {component.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          
          {component.type === 'select' && component.options ? (
            <Select
              value={testInputs[component.name] || component.defaultValue || ''}
              onValueChange={(value) => setTestInputs(prev => ({ ...prev, [component.name]: value }))}
            >
              <SelectTrigger className="bg-black/50 border-blue-500/30 text-blue-200 h-8 text-xs">
                <SelectValue placeholder={component.placeholder || `Select ${component.label}`} />
              </SelectTrigger>
              <SelectContent className="bg-black border-blue-500/30">
                {component.options.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-blue-200">
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-blue-400/70">{option.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : component.type === 'textarea' ? (
            <Textarea
              value={testInputs[component.name] || component.defaultValue || ''}
              onChange={(e) => setTestInputs(prev => ({ ...prev, [component.name]: e.target.value }))}
              placeholder={component.placeholder}
              className="bg-black/50 border-blue-500/30 text-blue-200 text-xs min-h-[60px]"
            />
          ) : component.type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={Boolean(testInputs[component.name])}
                onChange={(e) => setTestInputs(prev => ({ ...prev, [component.name]: e.target.checked }))}
                className="rounded border-blue-500/30"
              />
              <span className="text-blue-200 text-xs">{component.placeholder || component.label}</span>
            </div>
          ) : (
            <Input
              type={component.type}
              value={testInputs[component.name] || component.defaultValue || ''}
              onChange={(e) => setTestInputs(prev => ({ ...prev, [component.name]: e.target.value }))}
              placeholder={component.placeholder}
              className="bg-black/50 border-blue-500/30 text-blue-200 text-xs"
              min={component.validation?.min}
              max={component.validation?.max}
              minLength={component.validation?.minLength}
              maxLength={component.validation?.maxLength}
              pattern={component.validation?.pattern}
              required={component.required}
            />
          )}
        </div>
      ))}
      
      {/* Test button */}
      <Button
        onClick={handleRunTest}
        disabled={isRunningTest || !allRequiredFieldsValid}
        className="btn-matrix w-full text-sm px-4 py-3 min-h-[44px] flex items-center justify-center"
      >
        <span className="truncate font-medium">
          {isRunningTest ? 
            (isLiveMode ? "🚀 Running Live..." : "🧪 Testing...") : 
            (isLiveMode ? "🚀 Run Live Action" : "🧪 Test Action")
          }
        </span>
      </Button>
      
      {/* Show validation message if required fields are missing */}
      {!allRequiredFieldsValid && (
        <div className="text-amber-400 font-mono text-xs text-center p-2 bg-amber-500/10 rounded border border-amber-500/20">
          ⚠️ Please fill in all required fields to {isLiveMode ? 'run live action' : 'test action'}
        </div>
      )}
    </div>
  );
};

/**
 * ActionMindMapEditor - Dynamic API Integration
 * 
 * 🚀 NEW SUB-AGENT API ROUTES:
 * - Test Mode: Uses main app `/api/agent/test-steps` for pseudo step testing
 * - Live Mode (Local): Uses sub-agent `/api/actions/${actionName}` - fetches code from main app, executes locally
 * - Live Mode (Remote): Uses sub-agent `/api/trigger/action/${actionId}` - calls main app directly by ID
 * 
 * Benefits:
 * - Local execution: Better performance, runs against sub-agent's SQLite
 * - Remote execution: Always uses latest code from main app  
 * - Dynamic fetching: No redeployments needed when actions change
 */
interface ActionMindMapEditorProps {
  action: AgentAction;
  onUpdate: (action: AgentAction) => void;
  onDelete: () => void;
  onGoBack?: () => void; // Navigate back to action list
  allModels?: AgentModel[];
  documentId?: string;
}

interface MindMapNode {
  id: string;
  type: 'description' | 'step' | 'ui-components';
  title: string;
  content: string;
  status: 'empty' | 'processing' | 'complete' | 'ready';
  position: { 
    desktop: { x: number; y: number };
    mobile: { x: number; y: number };
  };
  connections: string[];
  data?: any;
}

interface MindMapConnection {
  id: string;
  from: string;
  to: string;
  status: 'complete' | 'inactive' | 'flowing';
}

export const ActionMindMapEditor = memo(({
  action,
  onUpdate,
  onDelete,
  onGoBack,
  allModels = [],
  documentId
}: ActionMindMapEditorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>('description');
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingUIComponents, setIsGeneratingUIComponents] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [actionCreated, setActionCreated] = useState(
    Boolean(action.execute?.code?.script) // Check if action already has code
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingStep, setEditingStep] = useState<{ step: PseudoCodeStep; index: number } | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false); // Track if we're in live run mode
  const [isRegeneratingSteps, setIsRegeneratingSteps] = useState(false); // Track step regeneration


  const [animatingConnection, setAnimatingConnection] = useState<string | null>(null);
  const [viewingModelChanges, setViewingModelChanges] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Initialize mind map nodes with responsive positioning
  const [nodes, setNodes] = useState<MindMapNode[]>(() => [
    {
      id: 'description',
      type: 'description',
      title: '💡 Action Idea',
      content: action.description || 'Your creative spark starts here',
      status: action.description ? 'complete' : 'empty',
      position: { 
        desktop: { x: 50, y: 200 },
        mobile: { x: 20, y: 50 }
      },
      connections: ['steps'],
      data: { name: action.name, description: action.description }
    },
    {
      id: 'steps',
      type: 'step',
      title: '🔄 Smart Steps',
      content: action.pseudoSteps?.length ? `${action.pseudoSteps.length} AI-crafted steps` : 'Intelligent workflow will emerge',
      status: action.pseudoSteps?.length ? 'complete' : 'empty',
      position: { 
        desktop: { x: 380, y: 200 },
        mobile: { x: 20, y: 220 }
      },
      connections: ['ui-components'],
      data: action.pseudoSteps
    },
    {
      id: 'ui-components',
      type: 'ui-components',
      title: '🎨 UI Components',
      content: 'Design the user interface',
              status: action.uiComponentsDesign?.length ? 'complete' : 'empty',
        position: { 
          desktop: { x: 710, y: 200 },
          mobile: { x: 20, y: 390 }
        },
        connections: [],
        data: action.uiComponentsDesign
    }
  ]);

  // Initialize connections
  const [connections] = useState<MindMapConnection[]>([
    { id: 'desc-to-steps', from: 'description', to: 'steps', status: 'inactive' },
    { id: 'steps-to-ui', from: 'steps', to: 'ui-components', status: 'inactive' }
  ]);

  // Update node status based on action changes
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      switch (node.id) {
        case 'description':
          return {
            ...node,
            status: action.name && action.description ? 'complete' : 'empty',
            data: { name: action.name, description: action.description }
          };
        case 'steps':
          return {
            ...node,
            status: action.pseudoSteps?.length ? 'complete' : 'empty',
            content: action.pseudoSteps?.length ? `${action.pseudoSteps.length} steps defined` : 'Steps will appear here',
            data: action.pseudoSteps
          };
        case 'ui-components':
          return {
            ...node,
            status: action.uiComponentsDesign?.length ? 'complete' : 'empty',
            content: action.uiComponentsDesign?.length ? `${action.uiComponentsDesign.length} UI components designed` : 'UI components will be designed',
            data: action.uiComponentsDesign
          };
        default:
          return node;
      }
    }));
  }, [action]);

  // Keyboard shortcut for details modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Only trigger if not typing in an input
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult) {
            setShowDetailsModal(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nodes]);

  const animateConnection = useCallback((connectionId: string) => {
    setAnimatingConnection(connectionId);
    setTimeout(() => {
      setAnimatingConnection(null);
    }, 2000);
  }, []);

  const generateStepsFromDescription = useCallback(async () => {
    if (!action.name.trim()) {
      alert('Please enter an action name first');
      return;
    }

    setIsGeneratingSteps(true);
    setSelectedNode('steps');
    animateConnection('desc-to-steps');

    // Update steps node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'steps' ? { ...node, status: 'processing', content: 'AI is analyzing your idea...' } : node
    ));

    try {
      // Step 1: Determine action type using AI if not already set
      let actionType = action.type;
      if (!actionType) {
        console.log('🧠 Determining action type from description...');
        const typeResponse = await fetch('/api/agent/generate-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: action.name,
            description: action.description || `Action to ${action.name}`,
            availableModels: allModels,
            entityType: 'action',
            type: 'mutation', // Default, but AI will determine the actual type
            documentId: documentId,
            businessContext: `Analyze this action and determine if it should be a 'query' (reads/analyzes data only) or 'mutation' (creates/updates/deletes data): ${action.description}`
          })
        });
        
        if (typeResponse.ok) {
          const typeData = await typeResponse.json();
          // Extract the determined type from the first step or use heuristics
          actionType = action.description?.toLowerCase().includes('create') || 
                      action.description?.toLowerCase().includes('update') || 
                      action.description?.toLowerCase().includes('delete') || 
                      action.description?.toLowerCase().includes('save') ||
                      action.description?.toLowerCase().includes('send') ||
                      action.description?.toLowerCase().includes('generate') ? 'mutation' : 'query';
          
          // Update the action with the determined type
          onUpdate({ ...action, type: actionType });
        } else {
          actionType = 'mutation'; // Default fallback
        }
      }
      
      console.log(`🎯 Using action type: ${actionType}`);

      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          availableModels: allModels,
          entityType: 'action',
          type: actionType, // Use the determined action type
          documentId: documentId, // Pass document ID for OAuth/credentials access
          businessContext: `Generate comprehensive, executable steps for ${action.name}. Create detailed steps with:

🔗 ENHANCED STEP REQUIREMENTS:
- Realistic mock input/output data for testing
- Actual executable code for each step
- Proper authentication handling for external APIs
- Comprehensive error handling and retry logic
- Step dependencies and data flow management
- Detailed logging messages for execution tracking

🔗 PARAMETER CHAINING CONTEXT: This action may be used in automated schedules where its outputs can feed into other actions. Design steps that produce clear, useful outputs with descriptive field names (e.g., "customerId", "reportUrl", "processedData") that can be referenced by subsequent actions in a workflow chain.

🔗 EXTERNAL API VALIDATION: Ensure only ONE type of external API is used (e.g., only Gmail OR only Shopify, not both). Multiple calls to the same API are allowed.

Make the action self-contained, thoroughly tested, and chain-friendly with production-ready code.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        
        onUpdate({
          ...action,
          type: actionType, // Use the determined action type
          pseudoSteps: generatedSteps,
          externalApiProvider: data.externalApiProvider,
          testCode: data.testCode,
          executionLogs: data.executionLogs,
          _internal: {
            ...data._internal,
            apiValidation: data._internal?.apiValidation
          }
        });

        // Show API validation warning if multiple providers detected
        if (data._internal?.apiValidation && !data._internal.apiValidation.isValid) {
          alert(`⚠️ External API Validation Warning:\nMultiple API providers detected: ${data._internal.apiValidation.conflictingProviders?.join(', ')}\n\nActions can only use ONE external API provider. Please modify your description to use only one API service.`);
        }
      } else {
        const errorData = await response.json();
        if (errorData.conflictingProviders) {
          alert(`❌ External API Error:\n${errorData.details}\n\nPlease modify your action to use only one external API provider.`);
        } else {
          alert(`Failed to generate enhanced steps: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error generating enhanced steps:', error);
      alert('Error generating enhanced steps. Please try again.');
    } finally {
      setIsGeneratingSteps(false);
    }
  }, [action, onUpdate, allModels, animateConnection, documentId]);

  // Regenerate all steps after editing a step description
  const regenerateStepsAfterEdit = useCallback(async () => {
    if (!action.name.trim()) {
      alert('Please enter an action name first');
      return;
    }

    setIsRegeneratingSteps(true);
    
    // Update steps node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'steps' ? { ...node, status: 'processing', content: 'AI is regenerating steps with your edits...' } : node
    ));

    try {
      const response = await fetch('/api/agent/generate-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          availableModels: allModels,
          entityType: 'action',
          type: action.type || 'mutation',
          documentId: documentId,
          businessContext: `Regenerate comprehensive, executable steps for ${action.name} with updated step descriptions. Create detailed steps with:

🔗 ENHANCED STEP REQUIREMENTS:
- Realistic mock input/output data for testing
- Actual executable code for each step
- Proper authentication handling for external APIs
- Comprehensive error handling and retry logic
- Step dependencies and data flow management
- Detailed logging messages for execution tracking

🔗 PARAMETER CHAINING CONTEXT: This action may be used in automated schedules where its outputs can feed into other actions. Design steps that produce clear, useful outputs with descriptive field names.

🔗 EXTERNAL API VALIDATION: Ensure only ONE type of external API is used. Multiple calls to the same API are allowed.

Make the action self-contained, thoroughly tested, and chain-friendly with production-ready code.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        
        onUpdate({
          ...action,
          type: action.type || 'mutation',
          pseudoSteps: generatedSteps,
          externalApiProvider: data.externalApiProvider,
          testCode: data.testCode,
          executionLogs: data.executionLogs,
          _internal: {
            ...data._internal,
            apiValidation: data._internal?.apiValidation
          }
        });

        // Update nodes
        setNodes(prev => prev.map(node => {
          if (node.id === 'steps') {
            return {
              ...node,
              status: 'complete',
              content: `${generatedSteps.length} steps regenerated`,
              data: { steps: generatedSteps }
            };
          }
          return node;
        }));

        // Show API validation alert if needed
        if (data._internal?.apiValidation?.hasConflict) {
          alert(`⚠️ Multiple External APIs Detected: ${data._internal.apiValidation.conflictingProviders.join(', ')}. Please ensure only one type of external API is used per action.`);
        }

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate steps');
      }
    } catch (error) {
      console.error('Step regeneration failed:', error);
      alert(`Failed to regenerate steps: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset steps node status
      setNodes(prev => prev.map(node => 
        node.id === 'steps' ? { ...node, status: 'ready', content: 'Click to regenerate steps' } : node
      ));
    } finally {
      setIsRegeneratingSteps(false);
      setEditingStep(null); // Close the editing modal
    }
  }, [action, onUpdate, allModels, documentId]);

  const generateUIComponentsFromSteps = useCallback(async (isRegeneration = false) => {
    if (!action.pseudoSteps?.length) {
      alert('Please generate steps first');
      return;
    }

    setIsGeneratingUIComponents(true);
    setSelectedNode('ui-components');
    animateConnection('steps-to-ui');

    // Update UI components node to processing state
    setNodes(prev => prev.map(node => 
      node.id === 'ui-components' ? { ...node, status: 'processing', content: 'AI is designing user interface...' } : node
    ));

    try {
      const regenerationContext = isRegeneration 
        ? 'This is a regeneration - create SIMPLER, more straightforward UI components. Prefer basic inputs over complex dropdowns unless absolutely necessary. Focus on essential fields only.'
        : '';

      const response = await fetch('/api/agent/generate-ui-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          pseudoSteps: action.pseudoSteps,
          availableModels: allModels,
          businessContext: `Generate user-friendly UI components for ${action.name}. Focus on making inputs intuitive (e.g., dropdowns instead of text fields for IDs). ${regenerationContext}

🔗 PARAMETER CHAINING CONTEXT: This action may receive inputs from previous actions in a schedule chain. Design UI components that can handle both user-provided inputs AND programmatic inputs from parameter references. Consider that some fields might be auto-populated from previous actions, so focus on the essential user inputs needed.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedUIComponents = data.uiComponents || [];
        
        onUpdate({
          ...action,
          uiComponentsDesign: generatedUIComponents
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate UI components: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating UI components:', error);
      alert('Error generating UI components. Please try again.');
    } finally {
      setIsGeneratingUIComponents(false);
    }
  }, [action, onUpdate, allModels, animateConnection]);

  const generateCodeFromSteps = useCallback(async () => {
    if (!action.pseudoSteps?.length) {
      alert('Please generate steps first');
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
          name: action.name,
          description: action.description || `Action to ${action.name}`,
          type: action.type || 'mutation', // Include action type
          pseudoSteps: action.pseudoSteps,
          uiComponents: action.uiComponentsDesign,
          availableModels: allModels,
          entityType: 'action',
          businessContext: `Generate comprehensive, executable code for ${action.name} based on steps and UI components. 

🔗 PARAMETER CHAINING CONTEXT: This action will be used in automated schedules and may receive inputs from previous actions. Ensure the generated code can handle parameter inputs gracefully and produces clear, well-structured outputs that can be used by subsequent actions in a chain.

🎯 ACTION TYPE: This is a ${action.type || 'mutation'} action - ${action.type === 'query' ? 'it should only read/analyze data' : 'it can create/update/delete data'}.`,
          enhancedAnalysis: action._internal?.enhancedAnalysis, // Include validated analysis
          testResults: nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult // Include test execution results
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save the action (validation temporarily disabled for debugging)
        onUpdate({
          ...action,
          execute: {
            code: {
              script: data.code || '',
              envVars: data.envVars || []
            }
          }
        });
        
        // Mark action as created and switch to live mode
        setActionCreated(true);
        setIsLiveMode(true);
        
        // Show success message
        alert('✅ Action created successfully!\n🚀 Ready for live execution!');
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
  }, [action, onUpdate, allModels]);

  const runTest = useCallback(async (inputParameters: any = {}, executionMode: 'local' | 'remote' = 'local') => {
    if (!action.pseudoSteps?.length) {
      alert('Please generate steps first');
      return;
    }

    setIsRunningTest(true);

    try {
      // Choose API endpoint based on mode and execution preference
      let apiEndpoint: string;
      let requestBody: any;

      if (isLiveMode) {
        // Determine if we're in main app or sub-agent app
        const isMainApp = !window.location.hostname.includes('vercel.app') || 
                         window.location.hostname.includes('rom.cards') ||
                         window.location.hostname.includes('localhost');
        
        // Get sub-agent URL from document metadata or environment
        const getSubAgentUrl = () => {
          // For now, construct from document ID (this should be set from deployment metadata)
          // In a real implementation, this would come from the document's deployment info
          if (documentId) {
            return `https://agent-${documentId}.vercel.app`;
          }
          // Fallback for testing
          return 'https://example-agent.vercel.app';
        };
        
        if (executionMode === 'remote' && action.id) {
          // Remote execution - call main app directly by action ID
          apiEndpoint = `/api/trigger/action/${action.id}`;
          requestBody = {
            input: inputParameters,
            member: {
              id: 'sub-agent-user', 
              role: 'admin',
              email: 'sub-agent@deployed.app'
            }
          };
        } else {
          // Local execution - call sub-agent's dynamic endpoint
          if (isMainApp && documentId) {
            // We're in main app, need to call sub-agent's endpoint
            const subAgentUrl = getSubAgentUrl();
            apiEndpoint = `${subAgentUrl}/api/actions/${action.name}`;
          } else {
            // We're in sub-agent app, call local endpoint
            apiEndpoint = `/api/actions/${action.name}`;
          }
          
          requestBody = {
            input: inputParameters,
            credentials: {} // Will be fetched by the dynamic endpoint
          };
        }
      } else {
        // Test mode - run actual testCode from pseudo steps with mockInput validation
        const hasTestCode = action.pseudoSteps?.some(step => step.testCode);
        
        if (hasTestCode) {
          // Use real step testing with actual testCode
          apiEndpoint = '/api/agent/test-actual-steps';
          requestBody = {
            steps: action.pseudoSteps,
            inputParameters: inputParameters
          };
        } else {
          // Fallback to mock testing for older actions
          apiEndpoint = '/api/agent/test-steps';
          requestBody = {
            steps: action.pseudoSteps,
            inputParameters: inputParameters,
            testMode: true,
            enhancedAnalysis: action._internal?.enhancedAnalysis
          };
        }
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the node data with results
        const testResult = isLiveMode ? {
          // Live mode result format - handle both local and remote execution
          success: true,
          steps: [], 
          finalResult: executionMode === 'remote' ? 
            `Live action executed successfully on main app` :
            `Live action executed successfully via sub-agent`,
          timestamp: Date.now(),
          executionTime: result.data?.executionTime || 0,
          stepResults: result.data?.stepResults || [{
            stepId: executionMode === 'remote' ? 'remote-execution' : 'dynamic-execution',
            step: executionMode === 'remote' ? 
              `Executed ${action.name} on main app by ID` :
              `Executed ${action.name} via sub-agent dynamic endpoint`,
            type: executionMode === 'remote' ? 'remote-action' : 'dynamic-action',
            result: {
              success: true,
              message: result.data?.message || 'Action executed successfully',
              executionTime: result.data?.executionTime || 0,
              executedLocally: executionMode === 'local' ? (result.data?.executedLocally || false) : false,
              triggeredRemotely: executionMode === 'remote' ? (result.triggeredRemotely || true) : false,
              usedCredentials: result.data?.usedCredentials || [],
              actionName: result.data?.actionName || action.name,
              actionId: executionMode === 'remote' ? action.id : undefined,
              timestamp: result.data?.timestamp
            }
          }],
          isLiveRun: true,
          // Execution metadata
          executionMode: executionMode,
          executedLocally: executionMode === 'local' ? (result.data?.executedLocally || false) : false,
          triggeredRemotely: executionMode === 'remote' ? (result.triggeredRemotely || true) : false,
          usedCredentials: result.data?.usedCredentials || [],
          actionName: result.data?.actionName || action.name
        } : {
          // Test mode result format - handle both real and mock testing
          success: true,
          steps: result.stepResults || [],
          finalResult: result.result || 'Action completed successfully',
          timestamp: result.timestamp,
          executionTime: result.executionTime || 0,
          stepResults: result.stepResults,
          testMode: result.testMode || 'mock-testing',
          summary: result.summary, // For real code testing
          realCodeTesting: result.testMode === 'real-code-testing'
        };

        setNodes(prev => prev.map(node => 
          node.id === 'ui-components' 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  lastTestResult: testResult
                }
              }
            : node
        ));
      } else {
        setNodes(prev => prev.map(node => 
          node.id === 'ui-components' 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  lastTestResult: {
                    success: false,
                    error: result.error || 'Test execution failed'
                  }
                }
              }
            : node
        ));
      }
    } catch (error) {
      setNodes(prev => prev.map(node => 
        node.id === 'ui-components' 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                lastTestResult: {
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              }
            }
          : node
      ));
    } finally {
      setIsRunningTest(false);
    }
  }, [action.pseudoSteps, isLiveMode, documentId]);

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'empty': return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
      case 'processing': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 animate-pulse';
      case 'complete': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'ready': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getConnectionPath = (from: MindMapNode, to: MindMapNode) => {
    const currentPosition = isMobile ? 'mobile' : 'desktop';
    const nodeWidth = isMobile ? 280 : 300;
    const nodeHeight = 120;
    
    const startX = from.position[currentPosition].x + (isMobile ? nodeWidth / 2 : nodeWidth);
    const startY = from.position[currentPosition].y + nodeHeight / 2;
    const endX = to.position[currentPosition].x + (isMobile ? nodeWidth / 2 : 0);
    const endY = to.position[currentPosition].y + nodeHeight / 2;
    
    if (isMobile) {
      // Vertical connections for mobile
      const midY = (startY + endY) / 2;
      return `M ${startX} ${startY} Q ${startX} ${midY} ${endX} ${endY}`;
    } else {
      // Horizontal curved connections for desktop
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} Q ${midX} ${startY} ${endX} ${endY}`;
    }
  };

  const renderNodeContent = (node: MindMapNode) => {
    if (selectedNode !== node.id) return null;

    switch (node.type) {
      case 'description':
        return (
          <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label htmlFor="action-name" className="text-blue-300 font-mono text-sm">✨ Action Name</Label>
              <Input
                id="action-name"
                value={action.name}
                onChange={(e) => onUpdate({ ...action, name: e.target.value })}
                placeholder="e.g., Create Customer Invoice"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-sm"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-300 font-mono text-sm">🎯 Action Type <span className="text-gray-500 text-xs">(AI-determined)</span></Label>
              <div className="bg-black/30 border border-blue-500/30 rounded-md px-3 py-2 text-blue-200 text-sm font-mono">
                {action.type ? (
                  <div className="flex items-center gap-2">
                    <span>{action.type === 'mutation' ? '🔧' : '📊'}</span>
                    <div>
                      <div className="font-medium capitalize">{action.type}</div>
                      <div className="text-xs text-blue-400/70">
                        {action.type === 'mutation' ? 'Creates, updates, or deletes data' : 'Reads, analyzes, or searches data'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">
                    Type will be determined by AI based on your description
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-description" className="text-blue-300 font-mono text-sm">📝 Vision & Purpose</Label>
              <Textarea
                id="action-description"
                value={action.description}
                onChange={(e) => onUpdate({ ...action, description: e.target.value })}
                placeholder="Paint the picture... What magic should this action create?"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs min-h-[80px] resize-none"
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateStepsFromDescription();
              }}
              disabled={!action.name.trim() || !action.description.trim() || isGeneratingSteps}
              className="btn-matrix w-full text-sm py-2"
            >
              {isGeneratingSteps ? "🤖 AI is crafting..." : "✨ Weave the Steps →"}
            </Button>
          </div>
        );

      case 'step':
        return (
          <div className="mt-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Clean Steps List */}
            <div className="max-h-80 overflow-y-auto space-y-4">
              {action.pseudoSteps?.map((step, index) => (
                <div key={step.id} className="group p-4 rounded-lg bg-black/20 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer">
                  {/* Header Row: Title + Buttons */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-300 font-mono font-semibold">
                        Step {index + 1}
                      </div>
                      {(() => {
                        const category = getStepCategory(step.type);
                        const categoryInfo = getStepCategoryInfo(category);
                        return (
                          <div className={`px-2 py-1 rounded text-xs font-mono ${categoryInfo.bgColor} ${categoryInfo.color} border ${categoryInfo.borderColor}`}>
                            {categoryInfo.icon} {categoryInfo.label}: {step.type}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStep({ step, index });
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <span className="text-xs">✏️</span>
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedSteps = action.pseudoSteps?.filter(s => s.id !== step.id) || [];
                          onUpdate({ ...action, pseudoSteps: updatedSteps });
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <CrossIcon size={10} />
                      </Button>
                    </div>
                  </div>

                  {/* Description Row */}
                  <div 
                    className="text-blue-200 text-sm font-mono leading-relaxed mb-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStep({ step, index });
                    }}
                  >
                    {step.description || 'Click to add description...'}
                  </div>

                  {/* Enhanced Step Information */}
                  <div className="space-y-2">
                    {/* Dependencies */}
                    {step.dependsOn && step.dependsOn.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-400">🔗 Depends on:</span>
                        <span className="text-yellow-300/70">
                          {step.dependsOn.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Authentication */}
                    {(step.oauthTokens || step.apiKeys) && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-orange-400">🔐 Auth:</span>
                        {step.oauthTokens && (
                          <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                            OAuth ({step.oauthTokens.provider})
                          </span>
                        )}
                        {step.apiKeys && (
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                            API Key ({step.apiKeys.provider})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Mock Data Preview */}
                    {(step.mockInput || step.mockOutput) && (
                      <div className="space-y-1">
                        {step.mockInput && Object.keys(step.mockInput).length > 0 && (
                          <div className="text-xs">
                            <span className="text-cyan-400">📊 Mock Input:</span>
                            <div className="text-cyan-300/70 font-mono bg-black/30 p-2 rounded mt-1 max-h-16 overflow-hidden">
                              {JSON.stringify(step.mockInput, null, 2).substring(0, 100)}...
                            </div>
                          </div>
                        )}
                        {step.mockOutput && Object.keys(step.mockOutput).length > 0 && (
                          <div className="text-xs">
                            <span className="text-cyan-400">📈 Mock Output:</span>
                            <div className="text-cyan-300/70 font-mono bg-black/30 p-2 rounded mt-1 max-h-16 overflow-hidden">
                              {JSON.stringify(step.mockOutput, null, 2).substring(0, 100)}...
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Status Indicators */}
                    <div className="flex items-center gap-2 text-xs">
                      {step.actualCode && (
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                          ✓ Code
                        </span>
                      )}
                      {step.testCode && (
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex items-center gap-1">
                          ✓ Test
                        </span>
                      )}
                      {step.errorHandling && (
                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded flex items-center gap-1">
                          ✓ Error Handling
                        </span>
                      )}
                    </div>

                    {/* Input/Output Row */}
                    {(step.inputFields?.length || step.outputFields?.length) ? (
                      <div className="flex items-center gap-4 text-xs text-blue-400/70">
                        {step.inputFields?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span>📥</span>
                            <span>{step.inputFields.length} input{step.inputFields.length > 1 ? 's' : ''}</span>
                          </span>
                        )}
                        {step.outputFields?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span>📤</span>
                            <span>{step.outputFields.length} output{step.outputFields.length > 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Step Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                const newStep: PseudoCodeStep = {
                  id: generateNewId('step', action.pseudoSteps || []),
                  type: 'findMany' as const,
                  description: '',
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
                  mockInput: {},
                  mockOutput: {},
                  testCode: '',
                  actualCode: '',
                  logMessage: `Step executing: `,
                  stepOrder: (action.pseudoSteps?.length || 0) + 1
                };
                const updatedSteps = [...(action.pseudoSteps || []), newStep];
                onUpdate({ ...action, pseudoSteps: updatedSteps });
              }}
              className="btn-matrix w-full text-sm py-3"
            >
              <PlusIcon size={14} />
              Add Step
            </Button>

            {/* Generate UI Components Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateUIComponentsFromSteps(false); // Initial generation
              }}
              disabled={!action.pseudoSteps?.length || isGeneratingUIComponents}
              className="btn-matrix w-full text-sm py-2"
            >
              {isGeneratingUIComponents ? "⚡ Designing..." : "🎨 Design UI →"}
            </Button>
          </div>
        );

              case 'ui-components':
          return (
            <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              {/* UI Components Status */}
              {action.uiComponentsDesign?.length ? (
                <div className="space-y-4">
                  <div className="text-blue-300 font-mono text-xs font-semibold">
                    🎨 UI Components Ready
                  </div>
                  
                  <div className="text-blue-400/70 font-mono text-xs text-center mb-4">
                    {action.uiComponentsDesign.length} interactive component{action.uiComponentsDesign.length > 1 ? 's' : ''} ready to run
                  </div>

                  {/* Test Action Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLiveMode(false);
                      setShowTestModal(true);
                    }}
                    className="btn-matrix w-full text-sm px-4 py-3 min-h-[48px] flex items-center justify-center"
                  >
                    <span className="truncate font-medium">
                      🧪 Test Action
                    </span>
                  </Button>



                  {/* Action Status */}
                  {actionCreated ? (
                                          <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-emerald-300 font-mono text-xs font-semibold mb-2">
                            🎉 Action Created Successfully!
                          </div>
                          <div className="text-emerald-200 text-xs mb-3">
                            "{action.name}" is ready to use
                          </div>
                          
                          {/* Live Action Buttons */}
                          <div className="flex gap-2 mb-3">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsLiveMode(true);
                                setShowTestModal(true);
                              }}
                              className="btn-matrix flex-1 text-xs px-2 py-2"
                            >
                              🚀 Run Live
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateCodeFromSteps();
                              }}
                              disabled={isGeneratingCode}
                              variant="outline"
                              className="flex-1 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 text-xs px-2 py-2"
                            >
                              🔄 Regen
                            </Button>
                          </div>
                          
                                                   <div className="text-emerald-400/70 text-xs space-y-1">
                             <div>📍 View in your action list</div>
                             <div>🚀 Run anytime with real data</div>
                             <div>👥 Share with your team</div>
                           </div>
                        </div>
                        
                                               <Button
                           onClick={(e) => {
                             e.stopPropagation();
                             if (onGoBack) {
                               onGoBack();
                             } else {
                               window.location.reload();
                             }
                           }}
                           className="btn-matrix w-full text-sm px-4 py-2 min-h-[40px] flex items-center justify-center"
                         >
                           <span className="truncate font-medium">
                             ← Back to Actions
                           </span>
                         </Button>
                      </div>
                  ) : nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-emerald-300 font-mono text-xs font-semibold mb-2">
                          {isLiveMode ? "✅ Live Action Executed" : "✅ Test Completed Successfully"}
                        </div>
                        <div className="text-emerald-400/70 font-mono text-xs">
                          {isLiveMode ? "Action ran with real data" : "Ready to create your live action"}
                        </div>
                      </div>
                      
                      {/* Alternative Create Action - if user closed modal */}
                      <div className="text-center">
                        {!isLiveMode && (
                          <>
                            <div className="text-blue-400/60 font-mono text-xs mb-2">
                              Make your action permanently available:
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateCodeFromSteps();
                              }}
                              disabled={isGeneratingCode}
                              className="btn-matrix w-full text-sm px-4 py-2 min-h-[40px] flex items-center justify-center"
                            >
                              <span className="truncate font-medium">
                                {isGeneratingCode ? "🔮 Creating..." : "✨ Create Live Action"}
                              </span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-blue-300 font-mono text-xs text-center">
                    🎨 AI will design interactive components for running this action
                  </div>
                  
                  {/* Generate UI Components Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateUIComponentsFromSteps(false); // Initial generation
                    }}
                    disabled={!action.pseudoSteps?.length || isGeneratingUIComponents}
                    className="btn-matrix w-full text-sm py-2"
                  >
                    {isGeneratingUIComponents ? "⚡ Designing..." : "🎨 Generate UI Components"}
                  </Button>
                </div>
              )}
            </div>
          );

      

      

      default:
        return null;
    }
  };

  if (viewingModelChanges) {
    return (
      <ModelExecutionChangesViewer
        modelChange={viewingModelChanges}
        onBack={() => setViewingModelChanges(null)}
      />
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 text-lg md:text-xl">🧠</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold text-blue-200 font-mono">
                  {action.name || (isMobile ? 'Mind Flow' : 'Action Mind Map')}
                </h3>
                {action.type && (
                  <span className={`px-2 py-1 rounded text-xs font-mono border ${
                    action.type === 'mutation' 
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {action.type === 'mutation' ? '🔧 MUTATION' : '📊 QUERY'}
                  </span>
                )}
              </div>
              <p className="text-blue-400 text-xs md:text-sm font-mono">
                {action.name ? (
                  action.type === 'mutation' 
                    ? 'Creates, updates, or deletes data' 
                    : 'Reads, analyzes, or searches data'
                ) : (
                  isMobile ? 'Idea → Steps → Test & Create' : 'Simple flow from idea to working action'
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="destructive"
            size={isMobile ? "sm" : "default"}
            className="px-2 md:px-4 py-1 md:py-2"
          >
            <div className="flex items-center gap-1 md:gap-2">
              <CrossIcon size={isMobile ? 14 : 16} />
              {!isMobile && <span>Remove</span>}
            </div>
          </Button>
        </div>
      </div>

      {/* Mind Map Container */}
      <div className="flex-1 relative min-h-[500px] overflow-auto">
        <div 
          ref={containerRef}
          className="relative bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-blue-950/20"
          style={{ 
            minHeight: isMobile ? '800px' : '600px', 
            minWidth: isMobile ? '320px' : '1100px',
            width: '100%'
          }}
        >
          {/* SVG for connections */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 1 }}
          >
            {connections.map(connection => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              if (!fromNode || !toNode) return null;

              return (
                <path
                  key={connection.id}
                  d={getConnectionPath(fromNode, toNode)}
                  stroke={connection.status === 'flowing' ? '#60A5FA' : '#3B82F6'}
                  strokeWidth={connection.status === 'flowing' ? 3 : 2}
                  fill="none"
                  strokeDasharray={connection.status === 'flowing' ? '0' : '5,5'}
                  className="transition-all duration-300"
                  style={{
                    filter: connection.status === 'flowing' ? 'drop-shadow(0 0 8px #60A5FA)' : 'none'
                  }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const currentPosition = isMobile ? 'mobile' : 'desktop';
            const nodeWidth = isMobile ? 280 : 300;
            
            return (
              <div
                key={node.id}
                className={`absolute transition-all duration-500 cursor-pointer ${
                  selectedNode === node.id ? 'z-20' : 'z-10'
                }`}
                style={{
                  left: node.position[currentPosition].x,
                  top: node.position[currentPosition].y,
                  width: nodeWidth,
                  transform: selectedNode === node.id ? 'scale(1.02)' : 'scale(1)',
                }}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              >
                <div
                  className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${
                    selectedNode === node.id
                      ? 'bg-blue-500/20 border-blue-400/60 shadow-xl shadow-blue-500/20'
                      : 'bg-blue-950/40 border-blue-500/30 hover:border-blue-400/50'
                  } ${
                    node.status === 'complete' ? 'ring-2 ring-emerald-400/50' :
                    node.status === 'processing' ? 'ring-2 ring-blue-400/50 ai-generating' : ''
                  }`}
                  style={{
                    backdropFilter: 'blur(8px)',
                    ...(selectedNode === node.id && {
                      boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                    }),
                    ...(node.status === 'processing' && {
                      animation: 'ai-glow 2s ease-in-out infinite alternate, ai-shimmer 3s linear infinite'
                    })
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-mono font-bold transition-all duration-300 ${
                      selectedNode === node.id ? 'text-blue-200 text-base' : 'text-blue-300 text-sm'
                    }`}>
                      {node.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {node.status === 'complete' && <span className="text-emerald-400 text-lg">✅</span>}
                      {node.status === 'processing' && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                          <span className="text-blue-400 text-lg animate-pulse">⚡</span>
                        </div>
                      )}
                      {node.status === 'empty' && <span className="text-blue-500/50 text-lg">⭕</span>}
                    </div>
                  </div>
                  
                  <div className={`text-blue-400 font-mono transition-all duration-300 ${
                    selectedNode === node.id ? 'text-sm' : 'text-xs'
                  }`}>
                    {node.content}
                  </div>

                  {selectedNode === node.id && (
                    <div className="transition-all duration-300 ease-out">
                      {renderNodeContent(node)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Actions */}
          {!selectedNode && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button
                onClick={() => setSelectedNode('description')}
                className="btn-matrix text-xs px-3 py-2"
                disabled={isGeneratingSteps || isGeneratingCode || isGeneratingUIComponents}
              >
                🎯 Start Here
              </Button>
              {action.description && (
                <Button
                  onClick={generateStepsFromDescription}
                  className="btn-matrix text-xs px-3 py-2"
                  disabled={!action.name.trim() || !action.description.trim() || isGeneratingSteps}
                >
                  {isGeneratingSteps ? "⚡" : "✨ Steps"}
                </Button>
              )}
              {(action.pseudoSteps?.length || 0) > 0 && (
                <Button
                  onClick={() => {
                    setSelectedNode('ui-components');
                    if (!action.uiComponentsDesign?.length) {
                      generateUIComponentsFromSteps(false);
                    }
                  }}
                  className="btn-matrix text-xs px-3 py-2"
                  disabled={!action.pseudoSteps?.length || isGeneratingUIComponents}
                >
                  {isGeneratingUIComponents ? "⚡" : "🎨 UI"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Action Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black/95 border border-blue-500/20">
                     <DialogHeader>
            <DialogTitle className="text-blue-300 font-mono text-lg">
              {actionCreated && !isLiveMode ? "🎉 Action Complete" : 
               isLiveMode ? "🚀 Live Run" : "🧪 Test Action"}: {action.name}
            </DialogTitle>
            {!(actionCreated && !isLiveMode) && (
              <div className="text-blue-400/70 text-sm font-mono">
                {isLiveMode ? 
                  "Running with production code against real data" :
                  "Running with pseudo code and test data to validate logic"
                }
              </div>
            )}
          </DialogHeader>
          
                     {/* Modal Content */}
           <div className="space-y-6 mt-4">
             {/* Interactive Test Components */}
             <div className={`p-4 rounded-lg ${isLiveMode ? 
               'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30' :
               'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30'
             }`}>
               <InteractiveTestComponents 
                 steps={action.pseudoSteps || []}
                 components={action.uiComponentsDesign || []}
                 allModels={allModels}
                 isRunningTest={isRunningTest}
                 isLiveMode={isLiveMode}
                 action={action}
                 documentId={documentId}
                 onRunTest={(inputParameters) => {
                   runTest(inputParameters);
                 }}
                 onTestResult={(result) => {
                   setNodes(prev => prev.map(node => 
                     node.id === 'ui-components' 
                       ? { ...node, data: { ...node.data, lastTestResult: result } }
                       : node
                   ));
                 }}
               />
             </div>

                         {/* UI Controls - After seeing the UI in action (Only in test mode) */}
            {!isLiveMode && (
              <div className="text-center space-y-3">
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      generateUIComponentsFromSteps(true); // Pass true for regeneration
                    }}
                    disabled={isGeneratingUIComponents}
                    variant="outline"
                    className="text-blue-300 hover:text-blue-200 border-blue-500/30 hover:bg-blue-500/10 text-sm px-4 py-2"
                  >
                    {isGeneratingUIComponents ? "⚡ Regenerating..." : "🔄 Regenerate UI"}
                  </Button>
                  <Button
                    onClick={() => {
                      // Clear existing UI components and test results
                      onUpdate({
                        ...action,
                        uiComponentsDesign: undefined
                      });
                      setNodes(prev => prev.map(node => 
                        node.id === 'ui-components' 
                          ? { ...node, data: { ...node.data, lastTestResult: null } }
                          : node
                      ));
                      setShowTestModal(false);
                    }}
                    variant="outline"
                    className="text-red-400/70 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 text-sm px-4 py-2"
                  >
                    🗑️ Clear & Start Over
                  </Button>
                </div>
              </div>
            )}

                         {/* Test Results */}
                          {nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult && (
               <div className="bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-lg p-6 space-y-6">
                 {/* Business Test Results Header */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-full">
                       <span className="text-black font-bold text-sm">✓</span>
                     </div>
                     <div>
                       <div className="text-emerald-300 font-semibold text-lg">
                         {isLiveMode ? 'Live Execution Successful!' : 'Test Successful!'}
                       </div>
                       <div className="text-emerald-400/80 text-sm font-mono">
                         {(() => {
                           const result = nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult;
                           if (!result) return '';
                           const counts = result.stepResults?.reduce((acc: any, step: any) => {
                             if (step.result?.created) acc.created += step.result.created;
                             if (step.result?.updated) acc.updated += step.result.updated;
                             if (step.result?.found) acc.found += step.result.found;
                             if (step.result?.record) acc.found += 1;
                             return acc;
                           }, { created: 0, updated: 0, found: 0 }) || {};
                           
                           const parts = [];
                           if (counts.created > 0) parts.push(`Created ${counts.created}`);
                           if (counts.updated > 0) parts.push(`Updated ${counts.updated}`);
                           if (counts.found > 0) parts.push(`Found ${counts.found}`);
                           if (isLiveMode) {
                             return parts.join(' • ') || `${result.totalChanges || 0} database operations completed`;
                           } else {
                             return parts.join(' • ') || 'Test scenario completed';
                           }
                         })()}
                       </div>
                     </div>
                   </div>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowDetailsModal(true)}
                     className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-mono"
                   >
                     📊 DETAILS
                   </Button>
                 </div>

                 {/* Quick Stats Cards */}
                 <div className="flex justify-center gap-4">
                   {(() => {
                     const result = nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult;
                     const counts = result?.stepResults?.reduce((acc: any, step: any) => {
                       if (step.result?.created) acc.created += step.result.created;
                       if (step.result?.updated) acc.updated += step.result.updated;
                       if (step.result?.found) acc.found += step.result.found;
                       if (step.result?.record) acc.found += 1;
                       return acc;
                     }, { created: 0, updated: 0, found: 0 }) || {};
                     
                     const items = [];
                     if (counts.created > 0) {
                       items.push(
                         <div key="created" className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center min-w-[80px]">
                           <div className="text-emerald-300 font-bold text-2xl">{counts.created}</div>
                           <div className="text-emerald-400/70 text-xs font-mono">Created</div>
                         </div>
                       );
                     }
                     if (counts.updated > 0) {
                       items.push(
                         <div key="updated" className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center min-w-[80px]">
                           <div className="text-blue-300 font-bold text-2xl">{counts.updated}</div>
                           <div className="text-blue-400/70 text-xs font-mono">Updated</div>
                         </div>
                       );
                     }
                     if (counts.found > 0) {
                       items.push(
                         <div key="found" className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center min-w-[80px]">
                           <div className="text-yellow-300 font-bold text-2xl">{counts.found}</div>
                           <div className="text-yellow-400/70 text-xs font-mono">Found</div>
                         </div>
                       );
                     }
                     return items;
                   })()}
                 </div>

                 {/* Execution Summary */}
                 <div className="flex items-center justify-center gap-6 py-4 border-t border-emerald-500/10">
                   <div className="flex items-center gap-2 text-sm font-mono">
                     <span className="text-emerald-400">⚡</span>
                     <span className="text-emerald-300">{nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult?.executionTime || 0}ms</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm font-mono">
                     <span className="text-blue-400">📊</span>
                     <span className="text-blue-300">{nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult?.stepResults?.length || 0} steps</span>
                   </div>
                   <div className="flex items-center gap-2 text-sm font-mono">
                     <span className="text-yellow-400">🤖</span>
                     <span className="text-yellow-300">{nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult?.stepResults?.filter((step: any) => step.step?.includes('AI') || step.step?.includes('Generate'))?.length || 0} AI</span>
                   </div>
                 </div>

                 {/* Detailed Log Access */}
                 <div className="text-center space-y-4 pt-2">
                   <div className="space-y-1">
                     <div className="text-emerald-300 font-mono font-medium">
                       🔍 Need step-by-step details?
                     </div>
                     <div className="text-emerald-400/70 text-sm">
                       {isLiveMode ? 
                         'See exactly how each database operation executed' :
                         'See exactly how each step processed your test data'
                       }
                     </div>
                   </div>
                   
                   <Button
                     variant="outline"
                     onClick={() => setShowDetailsModal(true)}
                     className="text-emerald-300 hover:text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/10 px-6 py-3 font-medium transition-all duration-200 hover:scale-105"
                   >
                     📊 View Detailed Execution Log →
                   </Button>
                   
                   <div className="text-emerald-500/50 text-xs font-mono">
                     💡 Press 'D' for quick access
                   </div>
                 </div>
               </div>
             )}

                                                  {/* Modal Actions */}
            <div className="pt-4 border-t border-blue-500/20">
              {isGeneratingCode ? (
                // Creating action - show progress
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-blue-300 font-mono text-lg mb-2">
                      🔮 Creating Your Live Action...
                    </div>
                    <div className="text-blue-400/70 text-sm font-mono">
                      Generating production code based on validated test results
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      disabled={true}
                      className="flex-[2] btn-matrix text-lg py-3 opacity-75"
                    >
                      🔮 Creating...
                    </Button>
                  </div>
                </div>
              ) : actionCreated && !isLiveMode ? (
                // Action already created - show success state (only in non-live mode)
                                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-emerald-300 font-mono text-lg mb-2">
                        🎉 Action Successfully Created!
                      </div>
                      <div className="text-blue-400/70 text-sm mb-4">
                        Your "{action.name}" action is now ready to use
                      </div>
                    </div>
                    
                    {/* Live Action Runner */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-3">
                      <div className="text-emerald-300 font-mono text-sm font-semibold">
                        🚀 Your Live Action is Ready
                      </div>
                      <div className="text-emerald-200 text-xs mb-3">
                        Run with real data or update the code:
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsLiveMode(true);
                            setActionCreated(false);
                            setShowTestModal(true);
                          }}
                          className="btn-matrix flex-1 text-sm px-3 py-2"
                        >
                          🚀 Run Live
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateCodeFromSteps();
                          }}
                          disabled={isGeneratingCode}
                          variant="outline"
                          className="flex-1 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 text-sm px-3 py-2"
                        >
                          {isGeneratingCode ? "🔄 Updating..." : "🔄 Regenerate Code"}
                        </Button>
                      </div>
                    </div>
                    
                                       <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                       <div className="text-blue-300 font-mono text-xs mb-2">📍 What's Next:</div>
                       <div className="text-blue-200 text-xs space-y-1">
                         <div>• View your action in the list below</div>
                         <div>• Run it anytime with real data</div>
                         <div>• Share it with your team</div>
                       </div>
                     </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowTestModal(false)}
                        className="flex-1 text-blue-300 border-blue-500/30"
                      >
                        Close
                      </Button>
                                           <Button
                         onClick={() => {
                           setShowTestModal(false);
                           if (onGoBack) {
                             onGoBack();
                           } else {
                             window.location.reload();
                           }
                         }}
                         className="flex-[2] btn-matrix text-sm py-2"
                       >
                         ← Back to Actions
                       </Button>
                    </div>
                  </div>
              ) : nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult ? (
                // After successful run - show creation action (test mode) or done (live mode)
                <div className="space-y-3">
                  <div className="text-center text-emerald-300 font-mono text-sm">
                    {isLiveMode ? 
                      "🎉 Live action executed successfully!" :
                      "🎉 Test completed successfully! Ready to create your live action."
                    }
                  </div>
                  <div className="flex gap-3">
                    {isLiveMode ? (
                      // Live mode - just close
                      <Button
                        onClick={() => setShowTestModal(false)}
                        className="w-full btn-matrix"
                      >
                        ✅ Done
                      </Button>
                    ) : (
                      // Test mode - close or create action
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => setShowTestModal(false)}
                          className="flex-1 text-gray-400 hover:text-gray-300"
                        >
                          Close
                        </Button>
                        <Button
                          onClick={() => {
                            generateCodeFromSteps();
                          }}
                          disabled={isGeneratingCode}
                          className="flex-[2] btn-matrix text-lg py-3"
                        >
                          {isGeneratingCode ? "🔮 Creating..." : "✨ Create Live Action"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Before test - simple close option
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowTestModal(false)}
                    className="px-8"
                  >
                    Close
                  </Button>
                </div>
              )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

            {/* Test Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black/95 border border-emerald-500/20">
          <DialogHeader className="border-b border-emerald-500/20 pb-4">
            <DialogTitle className="text-emerald-300 font-mono text-2xl mb-3 flex items-center gap-3">
              <span className="animate-pulse">🔍</span> 
              {isLiveMode ? 'Live Execution Details' : 'Test Execution Details'}
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                isLiveMode 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {isLiveMode ? 'LIVE RUN' : 'TEST RUN'}
              </span>
            </DialogTitle>
            <div className="text-emerald-400/80 text-base font-medium mb-2">
              {isLiveMode 
                ? 'Complete trace of live database operations and their real impact'
                : 'Complete trace of how your action processed test data through each step'
              }
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-emerald-300">
                <span>📊</span>
                <span>Data flows</span>
              </div>
              <div className="flex items-center gap-1 text-blue-300">
                <span>🔄</span>
                <span>Operations</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-300">
                <span>⚡</span>
                <span>Performance</span>
              </div>
              <div className="flex items-center gap-1 text-purple-300">
                <span>🤖</span>
                <span>AI Analysis</span>
              </div>
            </div>
          </DialogHeader>
          
          {/* Modal Content */}
          {nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult && (
            <div className="space-y-4 mt-6">
              {nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult?.stepResults?.map((step: any, index: number) => {
                const hasData = step.result && (step.result.record || step.result.records || step.result.created || step.result.updated);
                
                return (
                  <div key={step.stepId || index} className="p-4 rounded-lg bg-gradient-to-r from-blue-950/20 to-emerald-950/20 border border-blue-500/30">
                    {/* Step Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                        <span className="text-blue-300 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-blue-200 font-medium text-sm mb-1">
                          {getBusinessStepDescription(step)}
                        </div>
                        <div className="text-blue-400/70 text-xs">
                          {step.type} • {step.result && getBusinessResultSummary(step.result)}
                        </div>
                      </div>
                      <div className="text-emerald-400 text-lg">✓</div>
                    </div>

                    {/* Data Results for this step */}
                    {hasData && (
                      <div className="ml-12 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-emerald-300 font-medium text-xs mb-3">
                          📊 Data produced by this step:
                        </div>
                        
                        {/* Show created record */}
                        {step.result.record && (
                          <div className="space-y-2">
                            <div className="text-emerald-200 text-xs font-medium">✨ Created Record:</div>
                            <div className="bg-emerald-500/10 p-3 rounded">
                              <div className="font-mono text-emerald-300 text-xs mb-2">ID: {step.result.record.id}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(step.result.record)
                                  .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                                  .map(([key, value]) => (
                                    <div key={key} className="bg-emerald-500/10 p-2 rounded">
                                      <div className="text-emerald-300 text-xs font-medium">{key}</div>
                                      <div className="text-emerald-200 font-mono text-xs">{String(value)}</div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show found records */}
                        {step.result.records && step.result.records.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-emerald-200 text-xs font-medium">🔍 Found {step.result.records.length} Records:</div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {step.result.records.slice(0, 3).map((record: any, i: number) => (
                                <div key={i} className="bg-emerald-500/10 p-3 rounded">
                                  <div className="font-mono text-emerald-300 text-xs mb-2">#{i + 1}: {record.id}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {Object.entries(record)
                                      .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                                      .slice(0, 4)
                                      .map(([key, value]) => (
                                        <div key={key} className="bg-emerald-500/10 p-2 rounded">
                                          <div className="text-emerald-300 text-xs font-medium">{key}</div>
                                          <div className="text-emerald-200 font-mono text-xs">{String(value)}</div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ))}
                              {step.result.records.length > 3 && (
                                <div className="text-emerald-400/70 text-xs text-center p-2">
                                  ... and {step.result.records.length - 3} more records
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Show update results */}
                        {step.result.updated && step.result.updatedData && (
                          <div className="space-y-2">
                            <div className="text-emerald-200 text-xs font-medium">🔄 Updated Data:</div>
                            <div className="bg-emerald-500/10 p-3 rounded">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                {Object.entries(step.result.updatedData).map(([key, value]) => (
                                  <div key={key} className="bg-emerald-500/10 p-2 rounded">
                                    <div className="text-emerald-300 text-xs font-medium">{key}</div>
                                    <div className="text-emerald-200 font-mono text-xs">{String(value)}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="text-emerald-400/70 text-xs">
                                ✅ {step.result.affectedRecords} record(s) updated
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show API response */}
                        {step.result.apiResponse && (
                          <div className="space-y-2">
                            <div className="text-emerald-200 text-xs font-medium">🌐 API Response:</div>
                            <div className="bg-emerald-500/10 p-3 rounded font-mono text-xs">
                              <div className="text-emerald-300">Status: {step.result.apiResponse.status}</div>
                              <div className="text-emerald-300">Code: {step.result.apiResponse.statusCode}</div>
                            </div>
                          </div>
                        )}

                        {/* Show AI analysis */}
                        {step.result.analysis && (
                          <div className="space-y-2">
                            <div className="text-emerald-200 text-xs font-medium">🤖 AI Analysis:</div>
                            <div className="bg-emerald-500/10 p-3 rounded">
                              <div className="text-emerald-200 text-xs">{step.result.analysis}</div>
                              {step.result.confidence && (
                                <div className="text-emerald-400/70 text-xs mt-2">
                                  Confidence: {Math.round(step.result.confidence * 100)}%
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step Editing Modal */}
      <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border border-blue-500/20">
          <DialogHeader>
            <DialogTitle className="text-blue-300 font-mono text-lg">
              ✏️ Edit Step {editingStep ? editingStep.index + 1 : ''} Description
            </DialogTitle>
            <div className="text-sm text-amber-400 font-mono mt-2">
              💡 Only the description can be edited. All steps will be regenerated with new AI analysis.
            </div>
          </DialogHeader>
          
          {editingStep && (
            <div className="space-y-6 mt-4">
              {/* Step Type (Read-only) */}
              <div className="space-y-2">
                <Label className="text-blue-300 font-mono text-sm">Type (Read-only)</Label>
                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-600/30 text-gray-300 font-mono text-sm">
                  {editingStep.step.type}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  ℹ️ Step type is automatically determined when regenerating steps
                </div>
              </div>

              {/* Step Description */}
              <div className="space-y-2">
                <Label className="text-blue-300 font-mono text-sm">Description</Label>
                <Textarea
                  value={editingStep.step.description}
                  onChange={(e) => {
                    // Only update local editing state, don't save to action yet
                    setEditingStep({ ...editingStep, step: { ...editingStep.step, description: e.target.value } });
                  }}
                  placeholder="Describe what this step does..."
                  className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-sm min-h-[80px] resize-none"
                />
                <div className="text-xs text-amber-400 font-mono">
                  ⚠️ Changing the description will regenerate ALL steps with new AI analysis
                </div>
              </div>

              {/* Input Fields (Read-only) */}
              <div className="space-y-3">
                <Label className="text-blue-300 font-mono text-sm">📥 Input Fields (Read-only)</Label>
                <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-600/30">
                  {editingStep.step.inputFields && editingStep.step.inputFields.length > 0 ? (
                    <div className="space-y-2">
                      {editingStep.step.inputFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded bg-gray-800/30 border border-gray-600/20">
                          <div className="text-gray-300 font-mono text-sm flex-1">
                            <span className="text-blue-300">{field.name}</span>
                            <span className="text-gray-400 ml-2">({field.type})</span>
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </div>
                          {field.description && (
                            <div className="text-xs text-gray-400 flex-2">{field.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 font-mono text-sm text-center py-4">
                      No input fields defined
                    </div>
                  )}
                  <div className="text-xs text-gray-400 font-mono mt-3">
                    ℹ️ Input fields are automatically determined when regenerating steps
                  </div>
                </div>
              </div>

              {/* Output Fields (Read-only) */}
              <div className="space-y-3">
                <Label className="text-blue-300 font-mono text-sm">📤 Output Fields (Read-only)</Label>
                <div className="p-4 rounded-lg bg-gray-800/20 border border-gray-600/30">
                  {editingStep.step.outputFields && editingStep.step.outputFields.length > 0 ? (
                    <div className="space-y-2">
                      {editingStep.step.outputFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded bg-gray-800/30 border border-gray-600/20">
                          <div className="text-gray-300 font-mono text-sm flex-1">
                            <span className="text-blue-300">{field.name}</span>
                            <span className="text-gray-400 ml-2">({field.type})</span>
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </div>
                          {field.description && (
                            <div className="text-xs text-gray-400 flex-2">{field.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 font-mono text-sm text-center py-4">
                      No output fields defined
                    </div>
                  )}
                  <div className="text-xs text-gray-400 font-mono mt-3">
                    ℹ️ Output fields are automatically determined when regenerating steps
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/20">
                <Button
                  variant="outline"
                  onClick={() => setEditingStep(null)}
                  className="text-gray-400 border-gray-500/30"
                  disabled={isRegeneratingSteps}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    // Update the action description to include the edited step description
                    const updatedDescription = `${action.description || action.name}\n\nStep ${editingStep.index + 1}: ${editingStep.step.description}`;
                    
                    // Update the action with the new description
                    onUpdate({
                      ...action,
                      description: updatedDescription
                    });
                    
                    // Trigger regeneration of all steps
                    await regenerateStepsAfterEdit();
                  }}
                  className="btn-matrix px-6"
                  disabled={isRegeneratingSteps}
                >
                  {isRegeneratingSteps ? "🤖 Regenerating..." : "🔄 Regenerate All Steps"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

ActionMindMapEditor.displayName = 'ActionMindMapEditor'; 