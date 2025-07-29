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
import type { AgentAction, EnvVar, PseudoCodeStep, StepField, AgentModel, UIComponent, TestCase } from '../../types';
import { generateNewId } from '../../utils';

interface InteractiveTestComponentsProps {
  steps: PseudoCodeStep[];
  components: UIComponent[];
  allModels: AgentModel[];
  onTestResult: (result: any) => void;
  isRunningTest: boolean;
  onRunTest: (inputParameters: any) => void;
  isLiveMode?: boolean;
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
    case 'Database find unique':
      return `Found the specific ${step.description?.toLowerCase() || 'record'}`;
    case 'Database find many':
      return `Searched for ${step.description?.toLowerCase() || 'records'}`;
    case 'Database create':
      return `Created new ${step.description?.toLowerCase() || 'record'}`;
    case 'Database update unique':
    case 'Database update many':
      return `Updated ${step.description?.toLowerCase() || 'record'}`;
    case 'Database delete unique':
    case 'Database delete many':
      return `Removed ${step.description?.toLowerCase() || 'record'}`;
    case 'call external api':
      return `Connected to external service for ${step.description?.toLowerCase() || 'data'}`;
    case 'ai analysis':
      return `AI analyzed ${step.description?.toLowerCase() || 'data'}`;
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

const InteractiveTestComponents = ({ steps, components, allModels, onTestResult, isRunningTest, onRunTest, isLiveMode = false }: InteractiveTestComponentsProps) => {
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
  type: 'description' | 'step' | 'ui-components' | 'add-step';
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

  // Pure steps chain only (mind map shows only after idea is complete)
  const generateNodes = (): MindMapNode[] => {
    const nodes: MindMapNode[] = [];
    
    // Only show steps chain in mind map (after idea is submitted)
    if (action.pseudoSteps && action.pseudoSteps.length > 0) {
      action.pseudoSteps.forEach((step, index) => {
        const nextStepId = index < action.pseudoSteps!.length - 1 
          ? `step-${action.pseudoSteps![index + 1].id}` 
          : null;
        
        nodes.push({
          id: `step-${step.id}`,
          type: 'step',
          title: `Step ${index + 1}`,
          content: step.description || step.type,
          status: step.description ? 'complete' : 'empty',
          position: {
            desktop: { x: 50 + (index * 320), y: 50 },
            mobile: { x: 20, y: 50 + (index * 280) }
          },
          connections: nextStepId ? [nextStepId] : [],
          data: { step, index }
        });
      });
    }

    return nodes;
  };

  const [nodes, setNodes] = useState<MindMapNode[]>(() => generateNodes());

  // Generate connections dynamically based on nodes
  const generateConnections = (nodeList: MindMapNode[]): MindMapConnection[] => {
    const connections: MindMapConnection[] = [];
    
    nodeList.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodeList.find(n => n.id === targetId);
        if (targetNode) {
          connections.push({
            id: `${node.id}-to-${targetId}`,
            from: node.id,
            to: targetId,
            status: 'inactive'
          });
        }
      });
    });
    
    return connections;
  };

  // Update nodes when action changes
  useEffect(() => {
    setNodes(generateNodes());
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
          type: (action as any).type || 'mutation', // Default to mutation if type is not set
          businessContext: `Generate pseudo steps for ${action.name}. Make it comprehensive and realistic for business operations.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedSteps = data.pseudoSteps || [];
        
        onUpdate({
          ...action,
          pseudoSteps: generatedSteps,
          _internal: data._internal // Store enhanced analysis for real testing
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
  }, [action, onUpdate, allModels, animateConnection]);

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
          businessContext: `Generate user-friendly UI components for ${action.name}. Focus on making inputs intuitive (e.g., dropdowns instead of text fields for IDs). ${regenerationContext}`
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
          pseudoSteps: action.pseudoSteps,
          uiComponents: action.uiComponentsDesign,
          availableModels: allModels,
          entityType: 'action',
          businessContext: `Generate comprehensive, executable code for ${action.name} based on steps and UI components.`,
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
            ...action.execute,
            type: 'code',
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

  const runTest = useCallback(async (inputParameters: any = {}) => {
    if (!action.pseudoSteps?.length) {
      alert('Please generate steps first');
      return;
    }

    setIsRunningTest(true);

    try {
      // Choose API endpoint based on mode
      const apiEndpoint = isLiveMode ? '/api/agent/execute-action' : '/api/agent/test-steps';
      const requestBody = isLiveMode ? {
        // Live mode - execute real code with real data
        documentId: documentId,
        code: action.execute?.code?.script,
        inputParameters: inputParameters,
        envVars: {},
        testMode: false
      } : {
        // Test mode - run pseudo steps with test data
        steps: action.pseudoSteps,
        inputParameters: inputParameters,
        testMode: true,
        enhancedAnalysis: action._internal?.enhancedAnalysis
      };

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
          // Live mode result format - process real execution data
          success: true,
          steps: [], 
          finalResult: `Live action executed successfully - ${result.changesCount || 0} database operations`,
          timestamp: Date.now(),
          executionTime: result.executionTime || 0,
          stepResults: (result.changeLog || []).map((change: any, index: number) => ({
            stepId: `live-operation-${index}`,
            step: `${change.operation?.charAt(0).toUpperCase() + change.operation?.slice(1) || 'Database Operation'} ${change.model || 'Record'}`,
            type: change.operation || 'unknown',
            result: {
              success: true,
              message: change.description || `${change.operation} operation on ${change.model}`,
              executionTime: Math.round((result.executionTime || 0) / (result.changeLog?.length || 1)),
              // Convert live data to display format
              created: change.operation === 'create' ? 1 : 0,
              updated: change.operation === 'update' ? (change.affectedCount || 1) : 0,
              found: change.operation === 'findMany' || change.operation === 'findUnique' ? (change.recordCount || change.affectedCount || 1) : 0,
              record: change.recordData || change.data,
              records: change.operation === 'findMany' ? (change.records || [change.recordData || change.data].filter(Boolean)) : undefined,
              affectedRecords: change.affectedCount || 0,
              model: change.model,
              operation: change.operation
            }
          })),
          isLiveRun: true,
          // Additional live run metadata
          databaseUpdated: result.databaseUpdated,
          modelsAffected: result.modelsAffected || [],
          totalChanges: result.changesCount || 0
        } : {
          // Test mode result format  
          success: true,
          steps: result.stepResults || [],
          finalResult: result.result || 'Action completed successfully',
          timestamp: result.timestamp,
          executionTime: result.executionTime || 0,
          stepResults: result.stepResults
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
    
    // Only step-to-step connections now (within the chain)
    if (isMobile) {
      // Mobile: Vertical connections between steps
      const fromX = from.position[currentPosition].x + nodeWidth / 2;
      const fromY = from.position[currentPosition].y + nodeHeight;
      const toX = to.position[currentPosition].x + nodeWidth / 2;
      const toY = to.position[currentPosition].y;
      
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else {
      // Desktop: Horizontal connections between steps in chain
      const fromX = from.position[currentPosition].x + nodeWidth;
      const fromY = from.position[currentPosition].y + nodeHeight / 2;
      const toX = to.position[currentPosition].x;
      const toY = to.position[currentPosition].y + nodeHeight / 2;
      
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
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
        const stepData = node.data;
        if (!stepData?.step) return null;
        
        const { step, index } = stepData;
        
        return (
          <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Step Type Badge */}
            <div className="px-3 py-1.5 rounded-lg text-sm font-mono bg-blue-500/30 text-blue-200 border border-blue-500/40 font-semibold w-fit">
              {step.type}
            </div>
            
            {/* Description */}
            <div 
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-600/30 cursor-pointer hover:bg-slate-800/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setEditingStep({ step, index });
              }}
            >
              <div className="text-slate-300 text-sm font-mono leading-relaxed">
                {step.description || (
                  <span className="text-slate-500 italic">Click to add description...</span>
                )}
              </div>
            </div>

            {/* Input/Output Info */}
            {(step.inputFields?.length || step.outputFields?.length) && (
              <div className="flex items-center justify-center gap-6 py-3 bg-slate-800/30 rounded-xl border border-slate-600/20">
                {step.inputFields?.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm">📥</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs">{step.inputFields.length}</div>
                      <div className="text-xs text-slate-400">Input{step.inputFields.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}
                {step.outputFields?.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm">📤</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs">{step.outputFields.length}</div>
                      <div className="text-xs text-slate-400">Output{step.outputFields.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStep({ step, index });
                }}
                variant="ghost"
                size="sm"
                className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                ✏️ Edit
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedSteps = action.pseudoSteps?.filter(s => s.id !== step.id) || [];
                  onUpdate({ ...action, pseudoSteps: updatedSteps });
                }}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <CrossIcon size={14} />
              </Button>
            </div>
          </div>
        );

      case 'add-step':
        return (
          <div className="mt-4 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-blue-400/70 font-mono text-sm">
              Generate intelligent workflow steps with AI
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                generateStepsFromDescription();
              }}
              disabled={!action.name.trim() || !action.description.trim() || isGeneratingSteps}
              className="btn-matrix w-full text-sm py-3"
            >
              {isGeneratingSteps ? "🤖 AI is crafting..." : "✨ Generate Steps"}
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
              <h3 className="text-lg md:text-xl font-bold text-blue-200 font-mono">
                Action Builder
              </h3>
              <p className="text-blue-400 text-xs md:text-sm font-mono">
                Idea → Steps → Test & Create
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

      {/* Action Idea Section */}
      <div className="p-4 md:p-6 border-b border-blue-500/20 bg-blue-500/5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400">💡</span>
            </div>
            <h4 className="text-blue-200 font-mono font-semibold">Action Idea</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action-name" className="text-blue-300 font-mono text-sm">✨ Action Name</Label>
              <Input
                id="action-name"
                value={action.name}
                onChange={(e) => onUpdate({ ...action, name: e.target.value })}
                placeholder="e.g., Create Customer Invoice"
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-description" className="text-blue-300 font-mono text-sm">📝 Vision & Purpose</Label>
              <Textarea
                id="action-description"
                value={action.description}
                onChange={(e) => onUpdate({ ...action, description: e.target.value })}
                placeholder="Describe what this action should accomplish..."
                className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-xs min-h-[80px] resize-none"
              />
            </div>
            {action.name?.trim() && action.description?.trim() && !action.pseudoSteps?.length && (
              <Button
                onClick={generateStepsFromDescription}
                disabled={isGeneratingSteps}
                className="btn-matrix w-full text-sm py-2"
              >
                {isGeneratingSteps ? "🤖 AI is crafting..." : "✨ Generate Steps →"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Steps Chain Mind Map - Only shows when steps exist */}
      {action.pseudoSteps && action.pseudoSteps.length > 0 && (
        <div className="border-b border-purple-500/20 bg-purple-500/5">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <span className="text-purple-400">🔄</span>
              </div>
              <h4 className="text-purple-200 font-mono font-semibold">Steps Chain</h4>
              <div className="text-purple-400 text-xs">
                {action.pseudoSteps.length} step{action.pseudoSteps.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="relative min-h-[300px] overflow-auto">
            <div 
              ref={containerRef}
              className="relative bg-gradient-to-r from-purple-950/20 to-purple-900/20 p-4"
              style={{ 
                minHeight: isMobile ? 
                  `${100 + ((action.pseudoSteps?.length || 0) * 280)}px` : 
                  '200px', 
                minWidth: isMobile ? '320px' : 
                  `${Math.max(400, (action.pseudoSteps?.length || 0) * 320)}px`,
                width: '100%'
              }}
            >
              {/* SVG for connections */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                style={{ zIndex: 1 }}
              >
                {generateConnections(nodes).map((connection: MindMapConnection) => {
                  const fromNode = nodes.find(n => n.id === connection.from);
                  const toNode = nodes.find(n => n.id === connection.to);
                  if (!fromNode || !toNode) return null;

                  return (
                    <path
                      key={connection.id}
                      d={getConnectionPath(fromNode, toNode)}
                      stroke="#A855F7"
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray="5,5"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const currentPosition = isMobile ? 'mobile' : 'desktop';
                const nodeWidth = isMobile ? 280 : 300;
                
                // Clean unified styling for all nodes
                const getNodeStyle = () => {
                  return selectedNode === node.id
                    ? 'bg-slate-700/60 border-slate-400/80 shadow-xl'
                    : 'bg-slate-800/60 border-slate-600/50 hover:border-slate-400/70';
                };
                
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
                        getNodeStyle()
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
                          selectedNode === node.id ? 'text-slate-200 text-base' : 'text-slate-300 text-sm'
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
            </div>
          </div>
        </div>
      )}

      {/* UI & Test Section - Only shows when steps exist */}
      {action.pseudoSteps && action.pseudoSteps.length > 0 && (
        <div className="p-4 md:p-6 bg-emerald-500/5">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <span className="text-emerald-400">🎨</span>
              </div>
              <h4 className="text-emerald-200 font-mono font-semibold">UI & Test</h4>
              {action.uiComponentsDesign?.length && (
                <div className="text-emerald-400 text-xs">
                  {action.uiComponentsDesign.length} component{action.uiComponentsDesign.length > 1 ? 's' : ''} ready
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {/* UI Components Status */}
              {action.uiComponentsDesign?.length ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        setIsLiveMode(false);
                        setShowTestModal(true);
                      }}
                      className="btn-matrix flex-1"
                    >
                      🧪 Test Action
                    </Button>
                    
                    {actionCreated && (
                      <Button
                        onClick={() => {
                          setIsLiveMode(true);
                          setShowTestModal(true);
                        }}
                        className="btn-matrix flex-1"
                      >
                        🚀 Run Live
                      </Button>
                    )}
                  </div>
                  
                  {!actionCreated && nodes.find(n => n.id === 'ui-components')?.data?.lastTestResult && (
                    <Button
                      onClick={generateCodeFromSteps}
                      disabled={isGeneratingCode}
                      className="btn-matrix w-full"
                    >
                      {isGeneratingCode ? "🔮 Creating..." : "✨ Create Live Action"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-emerald-300 text-sm text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    Generate UI components to test and create your action
                  </div>
                  <Button
                    onClick={() => generateUIComponentsFromSteps(false)}
                    disabled={isGeneratingUIComponents}
                    className="btn-matrix w-full"
                  >
                    {isGeneratingUIComponents ? "⚡ Designing..." : "🎨 Generate UI Components"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              ✏️ Edit Step {editingStep ? editingStep.index + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          
          {editingStep && (
            <div className="space-y-6 mt-4">
              {/* Step Type */}
              <div className="space-y-2">
                <Label className="text-blue-300 font-mono text-sm">Type</Label>
                <Select
                  value={editingStep.step.type}
                  onValueChange={(value: "Database find unique" | "Database find many" | "Database update unique" | "Database update many" | "Database create" | "Database create many" | "Database delete unique" | "Database delete many" | "call external api" | "ai analysis") => {
                    const updatedSteps = action.pseudoSteps?.map(s => 
                      s.id === editingStep.step.id ? { ...s, type: value } : s
                    ) || [];
                    onUpdate({ ...action, pseudoSteps: updatedSteps });
                    setEditingStep({ ...editingStep, step: { ...editingStep.step, type: value } });
                  }}
                >
                  <SelectTrigger className="bg-black/50 border-blue-500/30 text-blue-200 text-sm font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-blue-500/30">
                    <SelectItem value="Database find unique" className="text-blue-200 font-mono">Database find unique</SelectItem>
                    <SelectItem value="Database find many" className="text-blue-200 font-mono">Database find many</SelectItem>
                    <SelectItem value="Database update unique" className="text-blue-200 font-mono">Database update unique</SelectItem>
                    <SelectItem value="Database update many" className="text-blue-200 font-mono">Database update many</SelectItem>
                    <SelectItem value="Database create" className="text-blue-200 font-mono">Database create</SelectItem>
                    <SelectItem value="Database create many" className="text-blue-200 font-mono">Database create many</SelectItem>
                    <SelectItem value="Database delete unique" className="text-blue-200 font-mono">Database delete unique</SelectItem>
                    <SelectItem value="Database delete many" className="text-blue-200 font-mono">Database delete many</SelectItem>
                    <SelectItem value="call external api" className="text-blue-200 font-mono">Call External API</SelectItem>
                    <SelectItem value="ai analysis" className="text-blue-200 font-mono">AI Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Step Description */}
              <div className="space-y-2">
                <Label className="text-blue-300 font-mono text-sm">Description</Label>
                <Textarea
                  value={editingStep.step.description}
                  onChange={(e) => {
                    const updatedSteps = action.pseudoSteps?.map(s => 
                      s.id === editingStep.step.id ? { ...s, description: e.target.value } : s
                    ) || [];
                    onUpdate({ ...action, pseudoSteps: updatedSteps });
                    setEditingStep({ ...editingStep, step: { ...editingStep.step, description: e.target.value } });
                  }}
                  placeholder="Describe what this step does..."
                  className="bg-black/50 border-blue-500/30 text-blue-200 font-mono text-sm min-h-[80px] resize-none"
                />
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                <Label className="text-blue-300 font-mono text-sm">📥 Input Fields</Label>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <StepFieldEditor
                    fields={editingStep.step.inputFields || []}
                    onFieldsChange={(fields) => {
                      const updatedSteps = action.pseudoSteps?.map(s => 
                        s.id === editingStep.step.id ? { ...s, inputFields: fields } : s
                      ) || [];
                      onUpdate({ ...action, pseudoSteps: updatedSteps });
                      setEditingStep({ ...editingStep, step: { ...editingStep.step, inputFields: fields } });
                    }}
                    label=""
                    color="blue"
                    allModels={allModels}
                  />
                </div>
              </div>

              {/* Output Fields */}
              <div className="space-y-3">
                <Label className="text-blue-300 font-mono text-sm">📤 Output Fields</Label>
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <StepFieldEditor
                    fields={editingStep.step.outputFields || []}
                    onFieldsChange={(fields) => {
                      const updatedSteps = action.pseudoSteps?.map(s => 
                        s.id === editingStep.step.id ? { ...s, outputFields: fields } : s
                      ) || [];
                      onUpdate({ ...action, pseudoSteps: updatedSteps });
                      setEditingStep({ ...editingStep, step: { ...editingStep.step, outputFields: fields } });
                    }}
                    label=""
                    color="blue"
                    allModels={allModels}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/20">
                <Button
                  variant="outline"
                  onClick={() => setEditingStep(null)}
                  className="text-gray-400 border-gray-500/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setEditingStep(null)}
                  className="btn-matrix px-6"
                >
                  ✅ Save Changes
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